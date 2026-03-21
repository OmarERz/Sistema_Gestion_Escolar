/**
 * Debt service.
 * Standalone utility for payment amount calculations and student debt tracking.
 * Kept free of imports from other services to avoid circular dependencies.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import prisma from '../config/database.js';

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/** Multiplicative formula: base * (1 - discount/100) * (1 + surcharge/100) */
export function calculateFinalAmount(
  baseAmount: number,
  discountPercent: number,
  surchargePercent: number,
): number {
  const result = baseAmount * (1 - discountPercent / 100) * (1 + surchargePercent / 100);
  return Math.round(result * 100) / 100;
}

/** Determine payment status based on amounts and due date */
export function determinePaymentStatus(
  finalAmount: number,
  amountPaid: number,
  dueDate: Date | null,
): 'paid' | 'partial' | 'overdue' | 'pending' {
  if (amountPaid >= finalAmount) return 'paid';
  if (dueDate && dueDate < new Date() && amountPaid < finalAmount) return 'overdue';
  if (amountPaid > 0 && amountPaid < finalAmount) return 'partial';
  return 'pending';
}

/** Recalculate amountPaid for a payment by summing all its transactions */
export async function recalculateAmountPaid(paymentId: number, tx: TxClient = prisma) {
  const result = await tx.paymentTransaction.aggregate({
    where: { paymentId },
    _sum: { amount: true },
  });

  const amountPaid = result._sum.amount ?? new Prisma.Decimal(0);

  // Get current payment to determine new status
  const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
  const status = determinePaymentStatus(
    Number(payment.finalAmount),
    Number(amountPaid),
    payment.dueDate,
  );

  await tx.payment.update({
    where: { id: paymentId },
    data: { amountPaid, status },
  });

  return { amountPaid: Number(amountPaid), status };
}

/** Recalculate totalDebt for a student: SUM(finalAmount - amountPaid) for non-cancelled payments */
export async function recalculateStudentDebt(studentId: number, tx: TxClient = prisma) {
  const result = await tx.payment.aggregate({
    where: {
      studentId,
      status: { in: ['pending', 'partial', 'overdue'] },
    },
    _sum: {
      finalAmount: true,
      amountPaid: true,
    },
  });

  const totalOwed = Number(result._sum.finalAmount ?? 0);
  const totalPaid = Number(result._sum.amountPaid ?? 0);
  const totalDebt = Math.max(0, Math.round((totalOwed - totalPaid) * 100) / 100);

  await tx.payment.count({ where: { studentId } }); // ensure student exists via relation
  await tx.student.update({
    where: { id: studentId },
    data: { totalDebt },
  });

  return totalDebt;
}
