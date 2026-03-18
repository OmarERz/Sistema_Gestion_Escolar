/**
 * School cycle service.
 * Handles CRUD operations and activation logic for school cycles.
 * Only one cycle can be active at a time — activating one deactivates all others.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { CreateSchoolCycleInput, UpdateSchoolCycleInput } from '../schemas/schoolCycle.schema.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';

export async function list(pagination: PaginationParams, sort: SortParams) {
  const orderBy = { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.schoolCycle.findMany({
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.schoolCycle.count(),
  ]);

  return { data, total };
}

export async function create(input: CreateSchoolCycleInput) {
  return prisma.schoolCycle.create({
    data: {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: false,
    },
  });
}

export async function update(id: number, input: UpdateSchoolCycleInput) {
  const existing = await prisma.schoolCycle.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');
  }

  return prisma.schoolCycle.update({
    where: { id },
    data: {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

/** Activates a cycle and deactivates all others in a single transaction */
export async function activate(id: number) {
  const existing = await prisma.schoolCycle.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'School cycle not found', 'CYCLE_NOT_FOUND');
  }

  return prisma.$transaction([
    prisma.schoolCycle.updateMany({
      data: { isActive: false },
    }),
    prisma.schoolCycle.update({
      where: { id },
      data: { isActive: true },
    }),
  ]);
}
