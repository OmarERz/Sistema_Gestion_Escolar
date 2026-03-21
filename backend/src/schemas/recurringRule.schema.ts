import { z } from 'zod';

export const createRecurringRuleSchema = z.object({
  paymentConceptId: z.number().int().positive(),
  schoolCycleId: z.number().int().positive(),
  generationDay: z.number().int().min(1).max(28),
  dueDay: z.number().int().min(1).max(28),
  startMonth: z.number().int().min(1).max(12),
  endMonth: z.number().int().min(1).max(12),
  amount: z.number().positive('Amount must be positive').nullable().optional(),
});

export const updateRecurringRuleSchema = z.object({
  generationDay: z.number().int().min(1).max(28).optional(),
  dueDay: z.number().int().min(1).max(28).optional(),
  startMonth: z.number().int().min(1).max(12).optional(),
  endMonth: z.number().int().min(1).max(12).optional(),
  amount: z.number().positive('Amount must be positive').nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateRecurringRuleInput = z.infer<typeof createRecurringRuleSchema>;
export type UpdateRecurringRuleInput = z.infer<typeof updateRecurringRuleSchema>;
