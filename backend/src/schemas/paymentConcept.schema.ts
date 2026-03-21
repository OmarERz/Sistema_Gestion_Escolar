import { z } from 'zod';

export const createPaymentConceptSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['mandatory', 'optional']),
  defaultAmount: z.number().positive('Amount must be positive'),
  isMonthly: z.boolean(),
});

export const updatePaymentConceptSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['mandatory', 'optional']),
  defaultAmount: z.number().positive('Amount must be positive'),
  isMonthly: z.boolean(),
  isActive: z.boolean(),
});

export type CreatePaymentConceptInput = z.infer<typeof createPaymentConceptSchema>;
export type UpdatePaymentConceptInput = z.infer<typeof updatePaymentConceptSchema>;
