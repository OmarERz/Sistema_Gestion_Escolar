import { z } from 'zod';

const LEVEL_VALUES = ['kinder', 'primaria', 'secundaria', 'prepa'] as const;

/** Max grade allowed per level */
const MAX_GRADE: Record<string, number> = {
  kinder: 3,
  primaria: 6,
  secundaria: 3,
  prepa: 3,
};

export const createGroupSchema = z.object({
  schoolCycleId: z.number().int().positive('School cycle is required'),
  level: z.enum(LEVEL_VALUES, { message: 'Invalid level' }),
  grade: z.string().min(1, 'Grade is required').max(10),
  section: z.string().min(1, 'Section is required').max(10),
}).refine((data) => {
  const gradeNum = parseInt(data.grade, 10);
  const max = MAX_GRADE[data.level];
  return !isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= max;
}, {
  message: 'Grade is out of range for the selected level',
  path: ['grade'],
});

export const updateGroupSchema = createGroupSchema;

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
