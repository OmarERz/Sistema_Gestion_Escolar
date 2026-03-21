/**
 * Student service.
 * Handles CRUD for students with transactional creation (student + guardians + fiscal data + academic history).
 * Search supports firstName, lastName1, lastName2 with case-insensitive contains.
 * Filters support status, schoolCycleId, and groupId.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { CreateStudentInput, UpdateStudentInput, GuardianInput } from '../schemas/student.schema.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';
import { bulkGenerateMandatory } from './payment.service.js';

interface StudentFilters {
  search?: string;
  status?: string;
  schoolCycleId?: number;
  groupId?: number;
  // When true, filters students with no group assigned (groupId IS NULL)
  noGroup?: boolean;
}

function buildWhere(filters: StudentFilters) {
  const conditions: Record<string, unknown>[] = [];

  if (filters.status) {
    conditions.push({ status: filters.status });
  }
  if (filters.schoolCycleId) {
    conditions.push({ schoolCycleId: filters.schoolCycleId });
  }
  if (filters.noGroup) {
    conditions.push({ groupId: null });
  } else if (filters.groupId) {
    conditions.push({ groupId: filters.groupId });
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim();
    conditions.push({
      OR: [
        { firstName: { contains: term } },
        { lastName1: { contains: term } },
        { lastName2: { contains: term } },
      ],
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function list(
  pagination: PaginationParams,
  filters: StudentFilters,
  sort: SortParams,
) {
  const where = buildWhere(filters);

  // Map sort keys to Prisma orderBy
  const orderBy = sort.sortBy === 'group'
    ? { group: { promotionOrder: sort.sortDir as 'asc' | 'desc' } }
    : { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        group: { select: { name: true, level: true } },
        schoolCycle: { select: { name: true } },
      },
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.student.count({ where }),
  ]);

  return { data, total };
}

export async function getById(id: number) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true, level: true, grade: true, section: true } },
      schoolCycle: { select: { id: true, name: true } },
      guardians: {
        include: {
          guardian: {
            include: {
              fiscalData: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  return student;
}

export async function create(input: CreateStudentInput) {
  // Validate school cycle exists
  const cycle = await prisma.schoolCycle.findUnique({ where: { id: input.schoolCycleId } });
  if (!cycle) {
    throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');
  }

  // Validate group exists if provided
  if (input.groupId) {
    const group = await prisma.group.findUnique({ where: { id: input.groupId } });
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create student
    const student = await tx.student.create({
      data: {
        firstName: input.firstName,
        lastName1: input.lastName1,
        lastName2: input.lastName2 ?? null,
        dateOfBirth: new Date(input.dateOfBirth),
        groupId: input.groupId ?? null,
        schoolCycleId: input.schoolCycleId,
        enrollmentDate: new Date(input.enrollmentDate),
        notes: input.notes ?? null,
        status: 'active',
        totalDebt: 0,
      },
    });

    // 2. Process guardians: create or link existing, then create student_guardian
    for (const guardianInput of input.guardians) {
      let guardianId: number;

      if (guardianInput.id) {
        // Link to existing guardian
        const existing = await tx.guardian.findUnique({ where: { id: guardianInput.id } });
        if (!existing) {
          throw new AppError(404, `Guardian with id ${guardianInput.id} not found`, 'GUARDIAN_NOT_FOUND');
        }
        guardianId = existing.id;
      } else {
        // Create new guardian — fields guaranteed by schema refine
        const newGuardian = await tx.guardian.create({
          data: {
            firstName: guardianInput.firstName!,
            lastName1: guardianInput.lastName1!,
            lastName2: guardianInput.lastName2 ?? null,
            email: guardianInput.email ?? null,
            phone: guardianInput.phone!,
            phoneSecondary: guardianInput.phoneSecondary ?? null,
            address: guardianInput.address ?? null,
          },
        });
        guardianId = newGuardian.id;
      }

      // Create student-guardian link
      await tx.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId,
          relationship: guardianInput.relationship,
          isPrimary: guardianInput.isPrimary,
        },
      });

      // 3. Create fiscal data if provided (only for new guardians)
      if (guardianInput.fiscalData && !guardianInput.id) {
        await tx.fiscalData.create({
          data: {
            guardianId,
            ...guardianInput.fiscalData,
            fiscalRegime: guardianInput.fiscalData.fiscalRegime ?? null,
            fiscalAddressExtNumber: guardianInput.fiscalData.fiscalAddressExtNumber ?? null,
            fiscalAddressIntNumber: guardianInput.fiscalData.fiscalAddressIntNumber ?? null,
            fiscalAddressNeighborhood: guardianInput.fiscalData.fiscalAddressNeighborhood ?? null,
          },
        });
      }
    }

    // 4. Create academic history record
    if (input.groupId) {
      await tx.studentAcademicHistory.create({
        data: {
          studentId: student.id,
          schoolCycleId: input.schoolCycleId,
          groupId: input.groupId,
          status: 'enrolled',
        },
      });
    }

    // Return full student with relations
    return tx.student.findUnique({
      where: { id: student.id },
      include: {
        group: { select: { id: true, name: true, level: true } },
        schoolCycle: { select: { id: true, name: true } },
        guardians: {
          include: {
            guardian: { include: { fiscalData: true } },
          },
        },
      },
    });
  });

  // Auto-generate mandatory payments after student creation (outside tx to avoid nested transactions)
  if (result) {
    await bulkGenerateMandatory(result.id, input.schoolCycleId).catch(() => {
      // Non-critical: log but don't fail student creation if payment generation fails
    });
  }

  return result;
}

export async function update(id: number, input: UpdateStudentInput) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  const data: Record<string, unknown> = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName1 !== undefined) data.lastName1 = input.lastName1;
  if (input.lastName2 !== undefined) data.lastName2 = input.lastName2 ?? null;
  if (input.dateOfBirth !== undefined) data.dateOfBirth = new Date(input.dateOfBirth);
  if (input.groupId !== undefined) data.groupId = input.groupId ?? null;
  if (input.schoolCycleId !== undefined) data.schoolCycleId = input.schoolCycleId;
  if (input.enrollmentDate !== undefined) data.enrollmentDate = new Date(input.enrollmentDate);
  if (input.status !== undefined) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes ?? null;

  return prisma.student.update({
    where: { id },
    data,
    include: {
      group: { select: { id: true, name: true, level: true } },
      schoolCycle: { select: { id: true, name: true } },
    },
  });
}

/** Add a guardian (new or existing) to a student. Max 4 guardians per student. */
export async function addGuardian(studentId: number, input: GuardianInput) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  const currentCount = await prisma.studentGuardian.count({ where: { studentId } });
  if (currentCount >= 4) {
    throw new AppError(400, 'Maximum 4 guardians per student', 'MAX_GUARDIANS');
  }

  return prisma.$transaction(async (tx) => {
    let guardianId: number;

    if (input.id) {
      const existing = await tx.guardian.findUnique({ where: { id: input.id } });
      if (!existing) {
        throw new AppError(404, `Guardian with id ${input.id} not found`, 'GUARDIAN_NOT_FOUND');
      }
      // Check not already linked
      const existingLink = await tx.studentGuardian.findUnique({
        where: { unique_student_guardian: { studentId, guardianId: input.id } },
      });
      if (existingLink) {
        throw new AppError(400, 'Guardian already linked to this student', 'ALREADY_LINKED');
      }
      guardianId = existing.id;
    } else {
      const newGuardian = await tx.guardian.create({
        data: {
          firstName: input.firstName!,
          lastName1: input.lastName1!,
          lastName2: input.lastName2 ?? null,
          email: input.email ?? null,
          phone: input.phone!,
          phoneSecondary: input.phoneSecondary ?? null,
          address: input.address ?? null,
        },
      });
      guardianId = newGuardian.id;
    }

    // If setting as primary, unset others
    if (input.isPrimary) {
      await tx.studentGuardian.updateMany({
        where: { studentId },
        data: { isPrimary: false },
      });
    }

    await tx.studentGuardian.create({
      data: {
        studentId,
        guardianId,
        relationship: input.relationship,
        isPrimary: input.isPrimary,
      },
    });

    // Create fiscal data if provided (only for new guardians)
    if (input.fiscalData && !input.id) {
      await tx.fiscalData.create({
        data: {
          guardianId,
          ...input.fiscalData,
          fiscalRegime: input.fiscalData.fiscalRegime ?? null,
          fiscalAddressExtNumber: input.fiscalData.fiscalAddressExtNumber ?? null,
          fiscalAddressIntNumber: input.fiscalData.fiscalAddressIntNumber ?? null,
          fiscalAddressNeighborhood: input.fiscalData.fiscalAddressNeighborhood ?? null,
        },
      });
    }

    return tx.student.findUnique({
      where: { id: studentId },
      include: {
        group: { select: { id: true, name: true, level: true } },
        schoolCycle: { select: { id: true, name: true } },
        guardians: {
          include: { guardian: { include: { fiscalData: true } } },
        },
      },
    });
  });
}

export async function getAcademicHistory(studentId: number) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  return prisma.studentAcademicHistory.findMany({
    where: { studentId },
    include: {
      schoolCycle: { select: { name: true } },
      group: { select: { name: true, level: true, grade: true, section: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
