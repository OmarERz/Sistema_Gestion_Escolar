import { z } from 'zod';

export const createWithdrawalSchema = z.object({
  studentId: z.number().int().positive(),
  reason: z.string().min(1, 'Reason is required').max(2000),
  withdrawalDate: z.string().date().optional(),
});

export const reenrollSchema = z.object({
  groupId: z.number().int().positive(),
  schoolCycleId: z.number().int().positive(),
  enrollmentDate: z.string().date().optional(),
  keepGuardianIds: z.array(z.number().int().positive()).optional(),
  addGuardianIds: z.array(z.number().int().positive()).optional(),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ReenrollInput = z.infer<typeof reenrollSchema>;
