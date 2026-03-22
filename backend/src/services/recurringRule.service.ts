/**
 * Recurring payment rule service.
 * Manages CRUD for rules that define automatic monthly payment generation.
 * The generatePayments function creates pending payments for active students
 * based on rules matching the current month.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';
import type { CreateRecurringRuleInput, UpdateRecurringRuleInput } from '../schemas/recurringRule.schema.js';
import { calculateFinalAmount, recalculateStudentDebt } from './debt.service.js';

export async function list(pagination: PaginationParams, sort: SortParams) {
  const orderBy = { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.recurringPaymentRule.findMany({
      include: {
        paymentConcept: { select: { id: true, name: true, defaultAmount: true, isMonthly: true } },
        schoolCycle: { select: { id: true, name: true } },
      },
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.recurringPaymentRule.count(),
  ]);

  return { data, total };
}

export async function create(input: CreateRecurringRuleInput) {
  const [concept, cycle] = await Promise.all([
    prisma.paymentConcept.findUnique({ where: { id: input.paymentConceptId } }),
    prisma.schoolCycle.findUnique({ where: { id: input.schoolCycleId } }),
  ]);

  if (!concept) throw new AppError(404, 'Payment concept not found', 'CONCEPT_NOT_FOUND');
  if (!cycle) throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');

  return prisma.recurringPaymentRule.create({
    data: {
      paymentConceptId: input.paymentConceptId,
      schoolCycleId: input.schoolCycleId,
      generationDay: input.generationDay,
      dueDay: input.dueDay,
      startMonth: input.startMonth,
      endMonth: input.endMonth,
      amount: input.amount ?? null,
      applyScholarship: input.applyScholarship ?? false,
      isActive: true,
    },
    include: {
      paymentConcept: { select: { id: true, name: true, defaultAmount: true, isMonthly: true } },
      schoolCycle: { select: { id: true, name: true } },
    },
  });
}

export async function update(id: number, input: UpdateRecurringRuleInput) {
  const existing = await prisma.recurringPaymentRule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Recurring rule not found', 'RULE_NOT_FOUND');
  }

  const data: Record<string, unknown> = {};
  if (input.generationDay !== undefined) data.generationDay = input.generationDay;
  if (input.dueDay !== undefined) data.dueDay = input.dueDay;
  if (input.startMonth !== undefined) data.startMonth = input.startMonth;
  if (input.endMonth !== undefined) data.endMonth = input.endMonth;
  if (input.amount !== undefined) data.amount = input.amount ?? null;
  if (input.applyScholarship !== undefined) data.applyScholarship = input.applyScholarship;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return prisma.recurringPaymentRule.update({
    where: { id },
    data,
    include: {
      paymentConcept: { select: { id: true, name: true, defaultAmount: true, isMonthly: true } },
      schoolCycle: { select: { id: true, name: true } },
    },
  });
}

/** Delete a recurring rule. Only allowed if the rule is inactive. */
export async function remove(id: number) {
  const existing = await prisma.recurringPaymentRule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Recurring rule not found', 'RULE_NOT_FOUND');
  }
  if (existing.isActive) {
    throw new AppError(400, 'Cannot delete an active rule. Deactivate it first.', 'RULE_ACTIVE');
  }

  await prisma.recurringPaymentRule.delete({ where: { id } });
  return { deleted: true };
}

/**
 * Generate payments for the current month based on active recurring rules.
 * For each rule where today >= generationDay and the current month is within range,
 * creates pending payments for all active students in the rule's school cycle.
 * Skips payments that already exist.
 */
export async function generatePayments() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const rules = await prisma.recurringPaymentRule.findMany({
    where: { isActive: true },
    include: {
      paymentConcept: true,
      schoolCycle: true,
    },
  });

  let generated = 0;
  let skipped = 0;

  for (const rule of rules) {
    // Check if current month falls within the rule's month range
    if (!isMonthInRange(currentMonth, rule.startMonth, rule.endMonth)) continue;

    // Check if today >= generation day
    if (currentDay < rule.generationDay) continue;

    const amount = rule.amount ? Number(rule.amount) : Number(rule.paymentConcept.defaultAmount);

    // Determine year for dueDate
    const year = now.getFullYear();
    const dueDate = new Date(year, currentMonth - 1, rule.dueDay);

    // Get all active students in this cycle (include scholarshipPercent for scholarship rules)
    const students = await prisma.student.findMany({
      where: { schoolCycleId: rule.schoolCycleId, status: 'active' },
      select: { id: true, scholarshipPercent: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const student of students) {
        const existing = await tx.payment.findFirst({
          where: {
            studentId: student.id,
            paymentConceptId: rule.paymentConceptId,
            schoolCycleId: rule.schoolCycleId,
            appliesToMonth: currentMonth,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Apply scholarship if rule has applyScholarship and student has scholarship
        const studentSchl = Number(student.scholarshipPercent);
        const applyScholarship = rule.applyScholarship && studentSchl > 0;
        const schlPct = applyScholarship ? studentSchl : 0;
        const finalAmount = calculateFinalAmount(amount, 0, 0, schlPct);

        await tx.payment.create({
          data: {
            studentId: student.id,
            paymentConceptId: rule.paymentConceptId,
            schoolCycleId: rule.schoolCycleId,
            appliesToMonth: currentMonth,
            baseAmount: amount,
            discountPercent: 0,
            surchargePercent: 0,
            hasScholarship: !!applyScholarship,
            scholarshipPercent: schlPct,
            finalAmount,
            amountPaid: 0,
            status: 'pending',
            dueDate,
          },
        });
        generated++;

        await recalculateStudentDebt(student.id, tx);
      }
    });
  }

  return { generated, skipped };
}

/** Check if a month falls within a start-end range, handling wrap-around (e.g. Aug-Jun) */
function isMonthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) {
    return month >= start && month <= end;
  }
  // Wrap-around: e.g. start=8 end=6 means Aug through Jun
  return month >= start || month <= end;
}
