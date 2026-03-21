/**
 * Payment method service.
 * Handles CRUD operations for payment methods (e.g., cash, transfer, card).
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../schemas/paymentMethod.schema.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';

export async function list(pagination: PaginationParams, sort: SortParams) {
  const orderBy = { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.paymentMethod.findMany({
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.paymentMethod.count(),
  ]);

  return { data, total };
}

export async function create(input: CreatePaymentMethodInput) {
  return prisma.paymentMethod.create({
    data: {
      name: input.name,
      isActive: true,
    },
  });
}

export async function update(id: number, input: UpdatePaymentMethodInput) {
  const existing = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Payment method not found', 'METHOD_NOT_FOUND');
  }

  return prisma.paymentMethod.update({
    where: { id },
    data: {
      name: input.name,
      isActive: input.isActive,
    },
  });
}
