import { z } from 'zod';

export const createSchoolCycleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateSchoolCycleSchema = createSchoolCycleSchema;

export type CreateSchoolCycleInput = z.infer<typeof createSchoolCycleSchema>;
export type UpdateSchoolCycleInput = z.infer<typeof updateSchoolCycleSchema>;
