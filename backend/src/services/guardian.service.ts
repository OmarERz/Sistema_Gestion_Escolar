/**
 * Guardian service.
 * Handles CRUD for guardians, duplicate detection (phone/email cross-check),
 * and fiscal data upsert.
 * Duplicate check compares both phone and phoneSecondary fields against
 * both phone and phoneSecondary columns in the database.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { CreateGuardianInput, UpdateGuardianInput, FiscalDataInput } from '../schemas/guardian.schema.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';

interface GuardianFilters {
  search?: string;
}

export async function list(
  pagination: PaginationParams,
  filters: GuardianFilters,
  sort: SortParams,
) {
  const term = filters.search?.trim();
  const where = term
    ? {
        OR: [
          { firstName: { contains: term } },
          { lastName1: { contains: term } },
          { lastName2: { contains: term } },
          { phone: { contains: term } },
          { email: { contains: term } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.guardian.findMany({
      where,
      include: {
        students: {
          select: {
            student: { select: { id: true, firstName: true, lastName1: true } },
            relationship: true,
          },
        },
        fiscalData: true,
      },
      orderBy: { [sort.sortBy]: sort.sortDir },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.guardian.count({ where }),
  ]);

  return { data, total };
}

export async function getById(id: number) {
  const guardian = await prisma.guardian.findUnique({
    where: { id },
    include: {
      students: {
        select: {
          student: { select: { id: true, firstName: true, lastName1: true, lastName2: true, status: true } },
          relationship: true,
          isPrimary: true,
        },
      },
      fiscalData: true,
    },
  });

  if (!guardian) {
    throw new AppError(404, 'Guardian not found', 'GUARDIAN_NOT_FOUND');
  }

  return guardian;
}

export async function create(input: CreateGuardianInput) {
  return prisma.guardian.create({
    data: {
      firstName: input.firstName,
      lastName1: input.lastName1,
      lastName2: input.lastName2 ?? null,
      email: input.email ?? null,
      phone: input.phone,
      phoneSecondary: input.phoneSecondary ?? null,
      address: input.address ?? null,
    },
    include: { fiscalData: true },
  });
}

export async function update(id: number, input: UpdateGuardianInput) {
  const existing = await prisma.guardian.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Guardian not found', 'GUARDIAN_NOT_FOUND');
  }

  return prisma.guardian.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName1: input.lastName1,
      lastName2: input.lastName2 ?? null,
      email: input.email ?? null,
      phone: input.phone,
      phoneSecondary: input.phoneSecondary ?? null,
      address: input.address ?? null,
    },
    include: { fiscalData: true },
  });
}

/**
 * Checks for duplicate guardians by cross-comparing phone numbers and email.
 * Both provided phones are checked against both phone and phoneSecondary in DB.
 */
export async function checkDuplicate(phone?: string, phoneSecondary?: string, email?: string) {
  const phoneConditions = [];
  const phonesToCheck = [phone, phoneSecondary].filter(Boolean) as string[];

  for (const p of phonesToCheck) {
    phoneConditions.push({ phone: p });
    phoneConditions.push({ phoneSecondary: p });
  }

  const conditions = [];
  if (phoneConditions.length > 0) {
    conditions.push({ OR: phoneConditions });
  }
  if (email) {
    conditions.push({ email });
  }

  if (conditions.length === 0) {
    return { exists: false, guardians: [] };
  }

  const guardians = await prisma.guardian.findMany({
    where: { OR: conditions },
    select: {
      id: true,
      firstName: true,
      lastName1: true,
      lastName2: true,
      email: true,
      phone: true,
      phoneSecondary: true,
    },
  });

  return { exists: guardians.length > 0, guardians };
}

/** Creates or updates fiscal data for a guardian (upsert) */
export async function upsertFiscalData(guardianId: number, input: FiscalDataInput) {
  const guardian = await prisma.guardian.findUnique({ where: { id: guardianId } });
  if (!guardian) {
    throw new AppError(404, 'Guardian not found', 'GUARDIAN_NOT_FOUND');
  }

  const fiscalFields = {
    rfc: input.rfc,
    businessName: input.businessName,
    cfdiUsage: input.cfdiUsage,
    fiscalRegime: input.fiscalRegime ?? null,
    fiscalAddressStreet: input.fiscalAddressStreet,
    fiscalAddressExtNumber: input.fiscalAddressExtNumber ?? null,
    fiscalAddressIntNumber: input.fiscalAddressIntNumber ?? null,
    fiscalAddressNeighborhood: input.fiscalAddressNeighborhood ?? null,
    fiscalAddressCity: input.fiscalAddressCity,
    fiscalAddressState: input.fiscalAddressState,
    fiscalAddressZip: input.fiscalAddressZip,
  };

  return prisma.fiscalData.upsert({
    where: { guardianId },
    update: fiscalFields,
    create: { guardianId, ...fiscalFields },
  });
}
