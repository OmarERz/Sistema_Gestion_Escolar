/**
 * Uniform service.
 * Handles CRUD for uniform catalog items and uniform orders (creation, delivery, deletion).
 * Each Uniform row is an independent order line; batch creation is a transactional abstraction.
 */

import prisma from '../config/database.js';
import { AppError } from '../utils/apiResponse.js';
import type { PaginationParams, SortParams } from '../utils/apiResponse.js';
import type { CreateCatalogInput, UpdateCatalogInput, CreateOrderInput, UpdateUniformInput } from '../schemas/uniform.schema.js';

// --------------- Catalog ---------------

interface CatalogFilters {
  search?: string;
  isActive?: boolean;
}

export async function listCatalog(
  pagination: PaginationParams,
  filters: CatalogFilters,
  sort: SortParams,
) {
  const where: Record<string, unknown> = {};

  if (filters.search?.trim()) {
    where.name = { contains: filters.search.trim() };
  }
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const [data, total] = await Promise.all([
    prisma.uniformCatalog.findMany({
      where,
      orderBy: { [sort.sortBy]: sort.sortDir },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.uniformCatalog.count({ where }),
  ]);

  return { data, total };
}

export async function createCatalogItem(input: CreateCatalogInput) {
  return prisma.uniformCatalog.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      basePrice: input.basePrice,
    },
  });
}

export async function updateCatalogItem(id: number, input: UpdateCatalogInput) {
  const existing = await prisma.uniformCatalog.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Catalog item not found', 'CATALOG_NOT_FOUND');
  }

  return prisma.uniformCatalog.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.basePrice !== undefined && { basePrice: input.basePrice }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteCatalogItem(id: number) {
  const existing = await prisma.uniformCatalog.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Catalog item not found', 'CATALOG_NOT_FOUND');
  }
  if (existing.isActive) {
    throw new AppError(400, 'Cannot delete an active catalog item. Deactivate it first.', 'CATALOG_ACTIVE');
  }

  // Check if any uniforms reference this catalog item
  const usageCount = await prisma.uniform.count({ where: { uniformCatalogId: id } });
  if (usageCount > 0) {
    throw new AppError(400, 'Cannot delete: this item has associated orders', 'CATALOG_IN_USE');
  }

  await prisma.uniformCatalog.delete({ where: { id } });
  return { deleted: true };
}

// --------------- Orders ---------------

interface OrderFilters {
  search?: string;
  isDelivered?: boolean;
}

const uniformInclude = {
  student: { select: { id: true, firstName: true, lastName1: true, lastName2: true } },
  uniformCatalog: { select: { id: true, name: true } },
};

function buildOrderWhere(filters: OrderFilters) {
  const conditions: Record<string, unknown>[] = [];

  if (filters.isDelivered !== undefined) {
    conditions.push({ isDelivered: filters.isDelivered });
  }
  if (filters.search?.trim()) {
    // Split search into words so "Juan García" matches firstName=Juan + lastName1=García
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

export async function listOrders(
  pagination: PaginationParams,
  filters: OrderFilters,
  sort: SortParams,
) {
  const where = buildOrderWhere(filters);

  const orderBy = sort.sortBy === 'student'
    ? { student: { lastName1: sort.sortDir as 'asc' | 'desc' } }
    : sort.sortBy === 'catalogItem'
      ? { uniformCatalog: { name: sort.sortDir as 'asc' | 'desc' } }
      : { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.uniform.findMany({
      where,
      include: uniformInclude,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.uniform.count({ where }),
  ]);

  return { data, total };
}

export async function createOrder(input: CreateOrderInput) {
  const student = await prisma.student.findUnique({ where: { id: input.studentId } });
  if (!student) {
    throw new AppError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }

  // Validate all catalog items exist and are active
  const catalogIds = input.items.map(i => i.uniformCatalogId);
  const catalogItems = await prisma.uniformCatalog.findMany({
    where: { id: { in: catalogIds } },
  });

  const catalogMap = new Map(catalogItems.map(c => [c.id, c]));

  for (const item of input.items) {
    const catalog = catalogMap.get(item.uniformCatalogId);
    if (!catalog) {
      throw new AppError(404, `Catalog item ${item.uniformCatalogId} not found`, 'CATALOG_NOT_FOUND');
    }
    if (!catalog.isActive) {
      throw new AppError(400, `Catalog item "${catalog.name}" is inactive`, 'CATALOG_INACTIVE');
    }
  }

  const orderDate = input.orderDate ? new Date(input.orderDate) : new Date();

  return prisma.$transaction(async (tx) => {
    const created = [];

    for (const item of input.items) {
      const catalog = catalogMap.get(item.uniformCatalogId)!;
      const unitPrice = Number(catalog.basePrice);
      const totalPrice = unitPrice * item.quantity;

      const uniform = await tx.uniform.create({
        data: {
          studentId: input.studentId,
          uniformCatalogId: item.uniformCatalogId,
          size: item.size,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          orderDate,
          notes: input.notes ?? null,
        },
        include: uniformInclude,
      });

      created.push(uniform);
    }

    return created;
  });
}

export async function updateUniform(id: number, input: UpdateUniformInput) {
  const existing = await prisma.uniform.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Uniform order item not found', 'UNIFORM_NOT_FOUND');
  }

  const quantity = input.quantity ?? existing.quantity;
  const totalPrice = Number(existing.unitPrice) * quantity;

  return prisma.uniform.update({
    where: { id },
    data: {
      ...(input.size !== undefined && { size: input.size }),
      ...(input.quantity !== undefined && { quantity, totalPrice }),
      ...(input.notes !== undefined && { notes: input.notes ?? null }),
    },
    include: uniformInclude,
  });
}

export async function markDelivered(id: number) {
  const existing = await prisma.uniform.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Uniform order item not found', 'UNIFORM_NOT_FOUND');
  }
  if (existing.isDelivered) {
    throw new AppError(400, 'Item is already delivered', 'ALREADY_DELIVERED');
  }

  return prisma.uniform.update({
    where: { id },
    data: {
      isDelivered: true,
      deliveryDate: new Date(),
    },
    include: uniformInclude,
  });
}

export async function deleteUniform(id: number) {
  const existing = await prisma.uniform.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Uniform order item not found', 'UNIFORM_NOT_FOUND');
  }

  await prisma.uniform.delete({ where: { id } });
  return { deleted: true };
}

export async function getStudentUniforms(
  studentId: number,
  pagination: PaginationParams,
  sort: SortParams,
) {
  const where = { studentId };

  const orderBy = sort.sortBy === 'catalogItem'
    ? { uniformCatalog: { name: sort.sortDir as 'asc' | 'desc' } }
    : { [sort.sortBy]: sort.sortDir };

  const [data, total] = await Promise.all([
    prisma.uniform.findMany({
      where,
      include: uniformInclude,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.uniform.count({ where }),
  ]);

  return { data, total };
}
