/**
 * Payment service.
 * Handles CRUD for payments and payment transactions.
 * Delegates amount/status/debt calculations to debt.service.ts to avoid circular deps.
 * All mutating operations recalculate amountPaid, status, and student totalDebt within a transaction.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';
import type { CreatePaymentInput, UpdatePaymentInput, CreateTransactionInput } from '../schemas/payment.schema.js';
import { calculateFinalAmount, recalculateAmountPaid, recalculateStudentDebt } from './debt.service.js';

interface PaymentFilters {
  search?: string;
  studentId?: number;
  paymentConceptId?: number;
  schoolCycleId?: number;
  status?: string;
}

function buildWhere(filters: PaymentFilters) {
  const conditions: Record<string, unknown>[] = [];

  if (filters.studentId) {
    conditions.push({ studentId: filters.studentId });
  }
  if (filters.paymentConceptId) {
    conditions.push({ paymentConceptId: filters.paymentConceptId });
  }
  if (filters.schoolCycleId) {
    conditions.push({ schoolCycleId: filters.schoolCycleId });
  }
  if (filters.status) {
    // Support comma-separated statuses (e.g. "pending,partial,overdue")
    const statuses = filters.status.split(',').map(s => s.trim());
    conditions.push({ status: { in: statuses } });
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    conditions.push({
      student: {
        OR: [
          { firstName: { contains: term } },
          { lastName1: { contains: term } },
          { lastName2: { contains: term } },
        ],
      },
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

const paymentInclude = {
  student: { select: { id: true, firstName: true, lastName1: true, lastName2: true } },
  paymentConcept: { select: { id: true, name: true, type: true } },
  schoolCycle: { select: { id: true, name: true } },
  transactions: {
    include: { paymentMethod: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
};

export async function list(
  pagination: PaginationParams,
  filters: PaymentFilters,
  sort: SortParams,
) {
  const where = buildWhere(filters);

  const orderBy = sort.sortBy === 'student'
    ? { student: { lastName1: sort.sortDir as 'asc' | 'desc' } }
    : { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, total };
}

export async function getById(id: number) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: paymentInclude,
  });

  if (!payment) {
    throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }

  return payment;
}

export async function create(input: CreatePaymentInput) {
  // Validate references
  const [student, concept, cycle] = await Promise.all([
    prisma.student.findUnique({ where: { id: input.studentId } }),
    prisma.paymentConcept.findUnique({ where: { id: input.paymentConceptId } }),
    prisma.schoolCycle.findUnique({ where: { id: input.schoolCycleId } }),
  ]);

  if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  if (!concept) throw new AppError(404, 'Payment concept not found', 'CONCEPT_NOT_FOUND');
  if (!cycle) throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');

  if (input.transaction?.paymentMethodId) {
    const method = await prisma.paymentMethod.findUnique({ where: { id: input.transaction.paymentMethodId } });
    if (!method) throw new AppError(404, 'Payment method not found', 'METHOD_NOT_FOUND');
    if (!method.isActive) throw new AppError(400, 'Payment method is inactive', 'METHOD_INACTIVE');
  }

  const finalAmount = calculateFinalAmount(
    input.baseAmount,
    input.discountPercent ?? 0,
    input.surchargePercent ?? 0,
  );

  // Validate transaction amount does not exceed finalAmount
  if (input.transaction && input.transaction.amount > finalAmount) {
    throw new AppError(400, 'Transaction amount exceeds final amount', 'OVERPAYMENT');
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        studentId: input.studentId,
        paymentConceptId: input.paymentConceptId,
        schoolCycleId: input.schoolCycleId,
        appliesToMonth: input.appliesToMonth ?? null,
        baseAmount: input.baseAmount,
        discountPercent: input.discountPercent ?? 0,
        surchargePercent: input.surchargePercent ?? 0,
        finalAmount,
        amountPaid: 0,
        status: 'pending',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.notes ?? null,
      },
    });

    // Create first transaction if provided
    if (input.transaction) {
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          amount: input.transaction.amount,
          paymentMethodId: input.transaction.paymentMethodId,
          paymentDate: input.transaction.paymentDate ? new Date(input.transaction.paymentDate) : new Date(),
          receiptNumber: input.transaction.receiptNumber ?? null,
          notes: input.transaction.notes ?? null,
        },
      });

      await recalculateAmountPaid(payment.id, tx);
    }

    await recalculateStudentDebt(input.studentId, tx);

    return tx.payment.findUnique({
      where: { id: payment.id },
      include: paymentInclude,
    });
  });
}

export async function update(id: number, input: UpdatePaymentInput) {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }
  if (existing.status === 'cancelled') {
    throw new AppError(400, 'Cannot update a cancelled payment', 'PAYMENT_CANCELLED');
  }

  return prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};

    // If amount fields change, recalculate finalAmount
    const baseAmount = input.baseAmount ?? Number(existing.baseAmount);
    const discountPercent = input.discountPercent ?? Number(existing.discountPercent);
    const surchargePercent = input.surchargePercent ?? Number(existing.surchargePercent);

    if (input.baseAmount !== undefined || input.discountPercent !== undefined || input.surchargePercent !== undefined) {
      data.baseAmount = baseAmount;
      data.discountPercent = discountPercent;
      data.surchargePercent = surchargePercent;
      data.finalAmount = calculateFinalAmount(baseAmount, discountPercent, surchargePercent);
    }

    if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.notes !== undefined) data.notes = input.notes ?? null;
    if (input.status !== undefined) data.status = input.status;

    await tx.payment.update({ where: { id }, data });

    // Recalculate status (in case finalAmount changed) and debt
    await recalculateAmountPaid(id, tx);
    await recalculateStudentDebt(existing.studentId, tx);

    return tx.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
  });
}

export async function remove(id: number) {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    // Cascade deletes transactions automatically
    await tx.payment.delete({ where: { id } });
    await recalculateStudentDebt(existing.studentId, tx);
    return { deleted: true };
  });
}

export async function cancel(id: number) {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }
  if (existing.status === 'cancelled') {
    throw new AppError(400, 'Payment is already cancelled', 'ALREADY_CANCELLED');
  }

  return prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    await recalculateStudentDebt(existing.studentId, tx);

    return tx.payment.findUnique({
      where: { id },
      include: paymentInclude,
    });
  });
}

export async function addTransaction(paymentId: number, input: CreateTransactionInput) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new AppError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }
  if (payment.status === 'cancelled') {
    throw new AppError(400, 'Cannot add transaction to a cancelled payment', 'PAYMENT_CANCELLED');
  }

  const method = await prisma.paymentMethod.findUnique({ where: { id: input.paymentMethodId } });
  if (!method) throw new AppError(404, 'Payment method not found', 'METHOD_NOT_FOUND');
  if (!method.isActive) throw new AppError(400, 'Payment method is inactive', 'METHOD_INACTIVE');

  // Overpayment check: amount must not exceed remaining balance
  const remaining = Number(payment.finalAmount) - Number(payment.amountPaid);
  if (input.amount > remaining + 0.001) {
    throw new AppError(400, `Amount exceeds remaining balance of ${remaining.toFixed(2)}`, 'OVERPAYMENT');
  }

  return prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.create({
      data: {
        paymentId,
        amount: input.amount,
        paymentMethodId: input.paymentMethodId,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        receiptNumber: input.receiptNumber ?? null,
        notes: input.notes ?? null,
      },
    });

    await recalculateAmountPaid(paymentId, tx);
    await recalculateStudentDebt(payment.studentId, tx);

    return tx.payment.findUnique({
      where: { id: paymentId },
      include: paymentInclude,
    });
  });
}

export async function removeTransaction(transactionId: number) {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
    include: { payment: true },
  });
  if (!transaction) {
    throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
  }
  if (transaction.payment.status === 'cancelled') {
    throw new AppError(400, 'Cannot remove transaction from a cancelled payment', 'PAYMENT_CANCELLED');
  }

  return prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.delete({ where: { id: transactionId } });
    await recalculateAmountPaid(transaction.paymentId, tx);
    await recalculateStudentDebt(transaction.payment.studentId, tx);

    return tx.payment.findUnique({
      where: { id: transaction.paymentId },
      include: paymentInclude,
    });
  });
}

/**
 * Generate mandatory payments for a student in a school cycle.
 * For each mandatory active concept: uses RecurringPaymentRule for months/dueDay if exists,
 * otherwise falls back to cycle date range + day 10.
 * Skips payments that already exist (unique constraint).
 */
export async function bulkGenerateMandatory(studentId: number, schoolCycleId: number) {
  const [student, cycle] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.schoolCycle.findUnique({ where: { id: schoolCycleId } }),
  ]);

  if (!student) throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  if (!cycle) throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');

  const mandatoryConcepts = await prisma.paymentConcept.findMany({
    where: { type: 'mandatory', isActive: true },
  });

  let generated = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const concept of mandatoryConcepts) {
      if (concept.isMonthly) {
        // Determine month range and dueDay from recurring rule or fallback
        const rule = await tx.recurringPaymentRule.findFirst({
          where: { paymentConceptId: concept.id, schoolCycleId, isActive: true },
        });

        let startMonth: number;
        let endMonth: number;
        let dueDay: number;
        let amount = Number(concept.defaultAmount);

        if (rule) {
          startMonth = rule.startMonth;
          endMonth = rule.endMonth;
          dueDay = rule.dueDay;
          if (rule.amount) amount = Number(rule.amount);
        } else {
          // Fallback: cycle start month to cycle end month, dueDay = 10
          startMonth = cycle.startDate.getMonth() + 1;
          endMonth = cycle.endDate.getMonth() + 1;
          dueDay = 10;
        }

        // Build month list up to current month (handles wrap-around, e.g. Aug=8 to Jun=6)
        const currentMonth = new Date().getMonth() + 1;
        const months = buildMonthList(startMonth, endMonth, currentMonth);

        for (const month of months) {
          const existing = await tx.payment.findFirst({
            where: {
              studentId,
              paymentConceptId: concept.id,
              schoolCycleId,
              appliesToMonth: month,
            },
          });

          if (existing) {
            skipped++;
            continue;
          }

          // Determine year: months >= startMonth use cycle start year, otherwise next year
          const year = month >= startMonth
            ? cycle.startDate.getFullYear()
            : cycle.endDate.getFullYear();

          const finalAmount = calculateFinalAmount(amount, 0, 0);
          const dueDate = new Date(year, month - 1, dueDay);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await tx.payment.create({
            data: {
              studentId,
              paymentConceptId: concept.id,
              schoolCycleId,
              appliesToMonth: month,
              baseAmount: amount,
              discountPercent: 0,
              surchargePercent: 0,
              finalAmount,
              amountPaid: 0,
              status: dueDate < today ? 'overdue' : 'pending',
              dueDate,
            },
          });
          generated++;
        }
      } else {
        // Non-monthly concept: single payment, no appliesToMonth
        const existing = await tx.payment.findFirst({
          where: {
            studentId,
            paymentConceptId: concept.id,
            schoolCycleId,
            appliesToMonth: null,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const amount = Number(concept.defaultAmount);
        const finalAmount = calculateFinalAmount(amount, 0, 0);

        await tx.payment.create({
          data: {
            studentId,
            paymentConceptId: concept.id,
            schoolCycleId,
            appliesToMonth: null,
            baseAmount: amount,
            discountPercent: 0,
            surchargePercent: 0,
            finalAmount,
            amountPaid: 0,
            status: 'pending',
          },
        });
        generated++;
      }
    }

    await recalculateStudentDebt(studentId, tx);
  });

  return { generated, skipped };
}

/**
 * Build list of months from start to end, wrapping around December if needed.
 * If upToMonth is provided, only include months up to (and including) that month
 * in the traversal order from start. This prevents generating future months.
 */
function buildMonthList(start: number, end: number, upToMonth?: number): number[] {
  const allMonths: number[] = [];
  if (start <= end) {
    for (let m = start; m <= end; m++) allMonths.push(m);
  } else {
    // Wrap around: e.g. 8→12 then 1→6
    for (let m = start; m <= 12; m++) allMonths.push(m);
    for (let m = 1; m <= end; m++) allMonths.push(m);
  }

  if (upToMonth === undefined) return allMonths;

  // Cut off at upToMonth in traversal order
  const cutIndex = allMonths.indexOf(upToMonth);
  if (cutIndex === -1) {
    // Current month not in range — check if all months are past or all are future
    // If range wraps and current month is between end+1 and start-1, all months are past
    if (start > end && upToMonth > end && upToMonth < start) return allMonths;
    // Non-wrapping: if current month > end, all months are past
    if (start <= end && upToMonth > end) return allMonths;
    // Otherwise current month is before the range starts — no months to generate
    return [];
  }
  return allMonths.slice(0, cutIndex + 1);
}

export async function resetStudentPayments(studentId: number) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  return prisma.$transaction(async (tx) => {
    // Delete all payments (cascade deletes transactions)
    await tx.payment.deleteMany({ where: { studentId } });
    await tx.student.update({
      where: { id: studentId },
      data: { totalDebt: 0 },
    });
    return { reset: true };
  });
}

/**
 * Settle all pending debts for a student.
 * Creates a transaction for each unpaid payment covering the remaining balance,
 * using the first active payment method and today's date.
 */
export async function payAllDebts(studentId: number) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  // Find all unpaid payments
  const unpaidPayments = await prisma.payment.findMany({
    where: {
      studentId,
      status: { in: ['pending', 'partial', 'overdue'] },
    },
  });

  if (unpaidPayments.length === 0) {
    return { settled: 0 };
  }

  // Get first active payment method
  const method = await prisma.paymentMethod.findFirst({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });
  if (!method) {
    throw new AppError(400, 'No active payment method found', 'NO_PAYMENT_METHOD');
  }

  return prisma.$transaction(async (tx) => {
    for (const payment of unpaidPayments) {
      const remaining = Number(payment.finalAmount) - Number(payment.amountPaid);
      if (remaining <= 0) continue;

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          amount: remaining,
          paymentMethodId: method.id,
          paymentDate: new Date(),
          notes: 'Saldado automáticamente',
        },
      });

      await recalculateAmountPaid(payment.id, tx);
    }

    await recalculateStudentDebt(studentId, tx);
    return { settled: unpaidPayments.length };
  });
}

/**
 * Mark overdue payments: pending payments with dueDate < today become overdue.
 * Returns the number of payments updated and affected student IDs for debt recalculation.
 */
export async function checkOverdue() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Find pending payments past due
  const overduePayments = await prisma.payment.findMany({
    where: {
      status: 'pending',
      dueDate: { lt: now },
    },
    select: { id: true, studentId: true },
  });

  if (overduePayments.length === 0) {
    return { updated: 0 };
  }

  const paymentIds = overduePayments.map(p => p.id);
  const studentIds = [...new Set(overduePayments.map(p => p.studentId))];

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status: 'overdue' },
    });

    // Recalculate debt for all affected students
    for (const sid of studentIds) {
      await recalculateStudentDebt(sid, tx);
    }
  });

  return { updated: overduePayments.length };
}

/** Get debt breakdown for a student: grouped by concept with totals */
export async function getDebtBreakdown(studentId: number) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  const payments = await prisma.payment.findMany({
    where: {
      studentId,
      status: { in: ['pending', 'partial', 'overdue'] },
    },
    include: {
      paymentConcept: { select: { id: true, name: true } },
    },
    orderBy: [{ paymentConceptId: 'asc' }, { appliesToMonth: 'asc' }],
  });

  // Group by concept
  const conceptMap = new Map<number, { conceptId: number; conceptName: string; totalOwed: number; totalPaid: number }>();

  for (const p of payments) {
    const key = p.paymentConceptId;
    const entry = conceptMap.get(key) ?? {
      conceptId: key,
      conceptName: p.paymentConcept.name,
      totalOwed: 0,
      totalPaid: 0,
    };
    entry.totalOwed += Number(p.finalAmount);
    entry.totalPaid += Number(p.amountPaid);
    conceptMap.set(key, entry);
  }

  const concepts = Array.from(conceptMap.values()).map(c => ({
    ...c,
    balance: Math.round((c.totalOwed - c.totalPaid) * 100) / 100,
  }));

  return {
    totalDebt: Number(student.totalDebt),
    concepts,
  };
}
