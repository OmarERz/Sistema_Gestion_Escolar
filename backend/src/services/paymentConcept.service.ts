/**
 * Payment concept service.
 * Handles CRUD operations for payment concepts (e.g., tuition, enrollment fee).
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { CreatePaymentConceptInput, UpdatePaymentConceptInput } from '../schemas/paymentConcept.schema.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';

export async function list(pagination: PaginationParams, sort: SortParams) {
  const orderBy = { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.paymentConcept.findMany({
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.paymentConcept.count(),
  ]);

  return { data, total };
}

export async function create(input: CreatePaymentConceptInput) {
  return prisma.paymentConcept.create({
    data: {
      name: input.name,
      type: input.type,
      defaultAmount: input.defaultAmount,
      isMonthly: input.isMonthly,
      isActive: true,
    },
  });
}

export async function update(id: number, input: UpdatePaymentConceptInput) {
  const existing = await prisma.paymentConcept.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Payment concept not found', 'CONCEPT_NOT_FOUND');
  }

  return prisma.paymentConcept.update({
    where: { id },
    data: {
      name: input.name,
      type: input.type,
      defaultAmount: input.defaultAmount,
      isMonthly: input.isMonthly,
      isActive: input.isActive,
    },
  });
}
