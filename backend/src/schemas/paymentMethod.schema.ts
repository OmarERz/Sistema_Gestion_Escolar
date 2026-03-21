import { z } from 'zod';

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  isActive: z.boolean(),
});

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
