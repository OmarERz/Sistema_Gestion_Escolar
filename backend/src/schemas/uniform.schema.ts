import { z } from 'zod';

export const createCatalogSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).nullable().optional(),
  basePrice: z.number().positive('Base price must be positive'),
});

export const updateCatalogSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(255).nullable().optional(),
  basePrice: z.number().positive('Base price must be positive').optional(),
  isActive: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  studentId: z.number().int().positive(),
  orderDate: z.string().date().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(z.object({
    uniformCatalogId: z.number().int().positive(),
    size: z.string().min(1).max(20),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
});

export const updateUniformSchema = z.object({
  size: z.string().min(1).max(20).optional(),
  quantity: z.number().int().positive().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type CreateCatalogInput = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogInput = z.infer<typeof updateCatalogSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateUniformInput = z.infer<typeof updateUniformSchema>;
