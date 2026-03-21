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

export const createGuardianSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName1: z.string().min(1, 'Last name is required').max(100),
  lastName2: emptyToNull.pipe(z.string().max(100).nullable().optional()),
  email: emailOrEmpty,
  phone: z.string().min(1, 'Phone is required').max(20),
  phoneSecondary: emptyToNull.pipe(z.string().max(20).nullable().optional()),
  address: emptyToNull,
});

export const updateGuardianSchema = createGuardianSchema;

export const fiscalDataSchema = z.object({
  rfc: z.string().min(12, 'RFC must be 12-13 characters').max(13),
  businessName: z.string().min(1, 'Business name is required').max(255),
  cfdiUsage: z.string().min(1, 'CFDI usage is required').max(100),
  fiscalRegime: emptyToNull.pipe(z.string().max(100).nullable().optional()),
  fiscalAddressStreet: z.string().min(1, 'Street is required').max(255),
  fiscalAddressExtNumber: emptyToNull.pipe(z.string().max(20).nullable().optional()),
  fiscalAddressIntNumber: emptyToNull.pipe(z.string().max(20).nullable().optional()),
  fiscalAddressNeighborhood: emptyToNull.pipe(z.string().max(100).nullable().optional()),
  fiscalAddressCity: z.string().min(1, 'City is required').max(100),
  fiscalAddressState: z.string().min(1, 'State is required').max(100),
  fiscalAddressZip: z.string().min(1, 'Zip code is required').max(10),
});

export const updateStudentLinkSchema = z.object({
  relationship: z.string().min(1).max(50).optional(),
  isPrimary: z.boolean().optional(),
});

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
export type FiscalDataInput = z.infer<typeof fiscalDataSchema>;
export type UpdateStudentLinkInput = z.infer<typeof updateStudentLinkSchema>;
