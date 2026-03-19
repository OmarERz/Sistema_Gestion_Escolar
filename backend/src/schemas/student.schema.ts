import { z } from 'zod';

/** Transforms empty strings to null for optional string fields */
const emptyToNull = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().nullable().optional(),
);

const emailOrEmpty = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().email('Invalid email').max(255).nullable().optional(),
);

/**
 * Guardian input for student creation.
 * Two modes:
 * - Link existing: provide `id` + `relationship` + `isPrimary` (personal fields ignored)
 * - Create new: provide all personal fields + `relationship` + `isPrimary`
 */
const guardianInputSchema = z.object({
  id: z.number().int().positive().optional(),
  firstName: z.string().max(100).optional(),
  lastName1: z.string().max(100).optional(),
  lastName2: emptyToNull.pipe(z.string().max(100).nullable().optional()),
  email: emailOrEmpty,
  phone: z.string().max(20).optional(),
  phoneSecondary: emptyToNull.pipe(z.string().max(20).nullable().optional()),
  address: emptyToNull,
  relationship: z.string().min(1, 'Relationship is required').max(50),
  isPrimary: z.boolean().default(false),
  fiscalData: z.object({
    rfc: z.string().min(12, 'RFC must be 12-13 characters').max(13),
    businessName: z.string().min(1).max(255),
    cfdiUsage: z.string().min(1).max(100),
    fiscalRegime: emptyToNull.pipe(z.string().max(100).nullable().optional()),
    fiscalAddressStreet: z.string().min(1).max(255),
    fiscalAddressExtNumber: emptyToNull.pipe(z.string().max(20).nullable().optional()),
    fiscalAddressIntNumber: emptyToNull.pipe(z.string().max(20).nullable().optional()),
    fiscalAddressNeighborhood: emptyToNull.pipe(z.string().max(100).nullable().optional()),
    fiscalAddressCity: z.string().min(1).max(100),
    fiscalAddressState: z.string().min(1).max(100),
    fiscalAddressZip: z.string().min(1).max(10),
  }).optional().nullable(),
}).refine(
  (data) => {
    // When linking an existing guardian, personal fields are not required
    if (data.id) return true;
    return !!data.firstName && !!data.lastName1 && !!data.phone;
  },
  { message: 'New guardians require firstName, lastName1, and phone', path: ['firstName'] },
);

export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName1: z.string().min(1, 'Last name is required').max(100),
  lastName2: emptyToNull.pipe(z.string().max(100).nullable().optional()),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  groupId: z.number().int().positive().optional().nullable(),
  schoolCycleId: z.number().int().positive('School cycle is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  notes: emptyToNull,
  guardians: z.array(guardianInputSchema)
    .min(1, 'At least one guardian is required')
    .max(4, 'Maximum 4 guardians allowed'),
}).refine(
  (data) => data.guardians.some((g) => g.isPrimary),
  { message: 'At least one guardian must be marked as primary', path: ['guardians'] },
);

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName1: z.string().min(1).max(100).optional(),
  lastName2: emptyToNull.pipe(z.string().max(100).nullable().optional()),
  dateOfBirth: z.string().optional(),
  groupId: z.number().int().positive().optional().nullable(),
  schoolCycleId: z.number().int().positive().optional(),
  enrollmentDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'withdrawn']).optional(),
  notes: emptyToNull,
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type GuardianInput = z.infer<typeof guardianInputSchema>;
