/**
 * Group service.
 * Handles CRUD operations for student groups.
 * Groups belong to a school cycle and hold students.
 * promotionOrder is calculated using a gap formula: levelIndex * 1000 + grade * 10 + sectionIndex,
 * so inserting new groups never requires recalculating existing ones.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { CreateGroupInput, UpdateGroupInput } from '../schemas/group.schema.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';

const LEVEL_ORDER: Record<string, number> = {
  kinder: 1,
  primaria: 2,
  secundaria: 3,
  prepa: 4,
};

/** Calculates promotionOrder using gap formula so new groups slot in without recalculation */
function calculatePromotionOrder(level: string, grade: string, section: string): number {
  const levelIndex = LEVEL_ORDER[level] ?? 0;
  const gradeNum = parseInt(grade, 10);
  // Map section letter to index: A=0, B=1, C=2, etc.
  const sectionIndex = section.toUpperCase().charCodeAt(0) - 65;
  return levelIndex * 1000 + gradeNum * 10 + sectionIndex;
}

export async function list(
  pagination: PaginationParams,
  filters: { schoolCycleId?: number },
  sort: SortParams,
) {
  const where = {
    ...(filters.schoolCycleId && { schoolCycleId: filters.schoolCycleId }),
  };

  // Map frontend sort keys to Prisma orderBy
  const orderBy = sort.sortBy === 'students'
    ? { students: { _count: sort.sortDir as 'asc' | 'desc' } }
    : { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.group.findMany({
      where,
      include: {
        schoolCycle: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.group.count({ where }),
  ]);

  return { data, total };
}

export async function create(input: CreateGroupInput) {
  const cycle = await prisma.schoolCycle.findUnique({ where: { id: input.schoolCycleId } });
  if (!cycle) {
    throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');
  }

  const name = `${input.grade}-${input.section.toUpperCase()}`;
  const promotionOrder = calculatePromotionOrder(input.level, input.grade, input.section);

  return prisma.group.create({
    data: {
      name,
      level: input.level,
      grade: input.grade,
      section: input.section.toUpperCase(),
      promotionOrder,
      schoolCycleId: input.schoolCycleId,
      isActive: true,
    },
    include: {
      schoolCycle: { select: { name: true } },
      _count: { select: { students: true } },
    },
  });
}

export async function update(id: number, input: UpdateGroupInput) {
  const existing = await prisma.group.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }

  const name = `${input.grade}-${input.section.toUpperCase()}`;
  const promotionOrder = calculatePromotionOrder(input.level, input.grade, input.section);

  return prisma.group.update({
    where: { id },
    data: {
      name,
      level: input.level,
      grade: input.grade,
      section: input.section.toUpperCase(),
      promotionOrder,
      schoolCycleId: input.schoolCycleId,
    },
    include: {
      schoolCycle: { select: { name: true } },
      _count: { select: { students: true } },
    },
  });
}

/** Removes all student assignments from a group (sets their groupId to null) */
export async function empty(id: number) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!group) {
    throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }
  if (group._count.students === 0) {
    throw new AppError(400, 'Group is already empty', 'GROUP_ALREADY_EMPTY');
  }

  await prisma.student.updateMany({
    where: { groupId: id },
    data: { groupId: null },
  });

  return { removedCount: group._count.students };
}

export async function remove(id: number) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!group) {
    throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
  }
  if (group._count.students > 0) {
    throw new AppError(
      409,
      `Cannot delete group with ${group._count.students} assigned students. Empty the group first.`,
      'GROUP_HAS_STUDENTS',
    );
  }

  return prisma.group.delete({ where: { id } });
}
