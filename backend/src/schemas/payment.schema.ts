import { z } from 'zod';

export const createPaymentSchema = z.object({
  studentId: z.number().int().positive(),
  paymentConceptId: z.number().int().positive(),
  schoolCycleId: z.number().int().positive(),
  appliesToMonth: z.number().int().min(1).max(12).nullable().optional(),
  baseAmount: z.number().positive('Base amount must be positive'),
  discountPercent: z.number().min(0).max(100).default(0),
  surchargePercent: z.number().min(0).max(100).default(0),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  // Optional first transaction to create alongside the payment
  transaction: z.object({
    amount: z.number().positive('Transaction amount must be positive'),
    paymentMethodId: z.number().int().positive(),
    paymentDate: z.string().date().optional(),
    receiptNumber: z.string().max(50).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
  }).optional(),
});

export const updatePaymentSchema = z.object({
  baseAmount: z.number().positive('Base amount must be positive').optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  surchargePercent: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
});

export const createTransactionSchema = z.object({
  amount: z.number().positive('Transaction amount must be positive'),
  paymentMethodId: z.number().int().positive(),
  paymentDate: z.string().date().optional(),
  receiptNumber: z.string().max(50).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const bulkGenerateSchema = z.object({
  studentId: z.number().int().positive(),
  schoolCycleId: z.number().int().positive(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type BulkGenerateInput = z.infer<typeof bulkGenerateSchema>;
