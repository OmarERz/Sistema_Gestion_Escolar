/**
 * Withdrawal service.
 * Handles student withdrawal processing (status change + debt snapshot),
 * undo withdrawal, re-enrollment, and listing of withdrawal records.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';
import type { CreateWithdrawalInput, ReenrollInput } from '../schemas/withdrawal.schema.js';

interface WithdrawalFilters {
  search?: string;
  schoolCycleId?: number;
}

const withdrawalInclude = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName1: true,
      lastName2: true,
      group: { select: { id: true, name: true, level: true } },
    },
  },
  schoolCycle: { select: { id: true, name: true } },
};

function buildWithdrawalWhere(filters: WithdrawalFilters) {
  const conditions: Record<string, unknown>[] = [];

  if (filters.schoolCycleId) {
    conditions.push({ schoolCycleId: filters.schoolCycleId });
  }

  if (filters.search?.trim()) {
    const words = filters.search.trim().split(/\s+/);
    for (const word of words) {
      conditions.push({
        student: {
          OR: [
            { firstName: { contains: word } },
            { lastName1: { contains: word } },
            { lastName2: { contains: word } },
          ],
        },
      });
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function listWithdrawals(
  pagination: PaginationParams,
  filters: WithdrawalFilters,
  sort: SortParams,
) {
  const where = buildWithdrawalWhere(filters);

  const orderBy = sort.sortBy === 'student'
    ? { student: { lastName1: sort.sortDir as 'asc' | 'desc' } }
    : { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      include: withdrawalInclude,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.withdrawal.count({ where }),
  ]);

  return { data, total };
}

export async function processWithdrawal(input: CreateWithdrawalInput) {
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { id: true, status: true, totalDebt: true, schoolCycleId: true },
  });

  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  if (student.status === 'withdrawn') {
    throw new AppError(400, 'Student is already withdrawn', 'ALREADY_WITHDRAWN');
  }

  const withdrawalDate = input.withdrawalDate
    ? new Date(input.withdrawalDate)
    : new Date();

  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.create({
      data: {
        studentId: student.id,
        reason: input.reason,
        withdrawalDate,
        pendingDebtAtWithdrawal: student.totalDebt,
        schoolCycleId: student.schoolCycleId,
      },
      include: withdrawalInclude,
    });

    await tx.student.update({
      where: { id: student.id },
      data: { status: 'withdrawn' },
    });

    return withdrawal;
  });
}

/** Undo a withdrawal: restore student to active status, delete the withdrawal record */
export async function undoWithdrawal(withdrawalId: number) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { student: { select: { id: true, status: true } } },
  });

  if (!withdrawal) {
    throw new AppError(404, 'Withdrawal not found', 'WITHDRAWAL_NOT_FOUND');
  }

  if (withdrawal.student.status !== 'withdrawn') {
    throw new AppError(400, 'Student is not currently withdrawn', 'NOT_WITHDRAWN');
  }

  return prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id: withdrawal.studentId },
      data: { status: 'active' },
    });

    await tx.withdrawal.delete({ where: { id: withdrawalId } });

    return { undone: true };
  });
}

/**
 * Re-enroll a withdrawn student: update group, cycle, enrollment date,
 * manage guardians, and create academic history entries.
 */
export async function reenroll(withdrawalId: number, input: ReenrollInput) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: {
      student: {
        select: {
          id: true,
          status: true,
          groupId: true,
          schoolCycleId: true,
          guardians: { select: { guardianId: true } },
        },
      },
    },
  });

  if (!withdrawal) {
    throw new AppError(404, 'Withdrawal not found', 'WITHDRAWAL_NOT_FOUND');
  }

  if (withdrawal.student.status !== 'withdrawn') {
    throw new AppError(400, 'Student is not currently withdrawn', 'NOT_WITHDRAWN');
  }

  // Validate group exists
  const group = await prisma.group.findUnique({ where: { id: input.groupId } });
  if (!group) {
    throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }

  // Validate cycle exists
  const cycle = await prisma.schoolCycle.findUnique({ where: { id: input.schoolCycleId } });
  if (!cycle) {
    throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');
  }

  const enrollmentDate = input.enrollmentDate
    ? new Date(input.enrollmentDate)
    : new Date();

  return prisma.$transaction(async (tx) => {
    // Update student: status, group, cycle, enrollment date
    await tx.student.update({
      where: { id: withdrawal.studentId },
      data: {
        status: 'active',
        groupId: input.groupId,
        schoolCycleId: input.schoolCycleId,
        enrollmentDate,
      },
    });

    // Handle guardians: remove those not in keepGuardianIds, add new ones
    const currentGuardianIds = withdrawal.student.guardians.map(g => g.guardianId);
    const keepIds = input.keepGuardianIds ?? currentGuardianIds;

    // Remove unlinked guardians (only if student will still have at least 1)
    const toRemove = currentGuardianIds.filter(id => !keepIds.includes(id));
    if (toRemove.length > 0 && (keepIds.length + (input.addGuardianIds?.length ?? 0)) > 0) {
      await tx.studentGuardian.deleteMany({
        where: {
          studentId: withdrawal.studentId,
          guardianId: { in: toRemove },
        },
      });
    }

    // Add new guardian links
    if (input.addGuardianIds?.length) {
      for (const guardianId of input.addGuardianIds) {
        const exists = await tx.studentGuardian.findUnique({
          where: { unique_student_guardian: { studentId: withdrawal.studentId, guardianId } },
        });
        if (!exists) {
          await tx.studentGuardian.create({
            data: {
              studentId: withdrawal.studentId,
              guardianId,
              relationship: 'Tutor',
              isPrimary: false,
            },
          });
        }
      }
    }

    // Create academic history entries
    // 1. Withdrawal record (from the old cycle/group)
    const existingWithdrawnEntry = await tx.studentAcademicHistory.findFirst({
      where: {
        studentId: withdrawal.studentId,
        schoolCycleId: withdrawal.schoolCycleId,
        status: 'withdrawn',
      },
    });

    if (!existingWithdrawnEntry) {
      await tx.studentAcademicHistory.create({
        data: {
          studentId: withdrawal.studentId,
          schoolCycleId: withdrawal.schoolCycleId,
          groupId: withdrawal.student.groupId ?? input.groupId,
          status: 'withdrawn',
          notes: `Baja: ${withdrawal.reason}`,
        },
      });
    }

    // 2. Re-enrollment record
    await tx.studentAcademicHistory.create({
      data: {
        studentId: withdrawal.studentId,
        schoolCycleId: input.schoolCycleId,
        groupId: input.groupId,
        status: 'reenrolled',
        notes: 'Reinscripción',
      },
    });

    // Keep the withdrawal record (for history) but do NOT delete it

    return tx.student.findUnique({
      where: { id: withdrawal.studentId },
      include: {
        group: { select: { id: true, name: true, level: true } },
        schoolCycle: { select: { id: true, name: true } },
        guardians: {
          include: {
            guardian: { select: { id: true, firstName: true, lastName1: true, lastName2: true } },
          },
        },
      },
    });
  });
}
