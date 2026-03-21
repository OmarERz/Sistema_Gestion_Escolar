/**
 * Uniform controller.
 * Handles HTTP requests for uniform catalog CRUD and order management
 * (creation, delivery tracking, deletion).
 */

import { Request, Response } from 'express';
import * as uniformService from '../services/uniform.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreateCatalogInput, UpdateCatalogInput, CreateOrderInput, UpdateUniformInput } from '../schemas/uniform.schema.js';

const CATALOG_SORTABLE_FIELDS = ['name', 'basePrice', 'isActive', 'createdAt'];
const ORDER_SORTABLE_FIELDS = ['orderDate', 'totalPrice', 'isDelivered', 'createdAt', 'student', 'catalogItem', 'size', 'quantity'];

// --------------- Catalog ---------------

export async function listCatalog(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, CATALOG_SORTABLE_FIELDS, 'name');

  const filters = {
    search: req.query.search as string | undefined,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
  };

  const { data, total } = await uniformService.listCatalog(pagination, filters, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function createCatalog(req: Request, res: Response) {
  const input = req.body as CreateCatalogInput;
  const item = await uniformService.createCatalogItem(input);
  successResponse(res, item, 201);
}

export async function updateCatalog(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdateCatalogInput;
  const item = await uniformService.updateCatalogItem(id, input);
  successResponse(res, item);
}

export async function deleteCatalog(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const result = await uniformService.deleteCatalogItem(id);
  successResponse(res, result);
}

// --------------- Orders ---------------

export async function listOrders(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, ORDER_SORTABLE_FIELDS, 'createdAt', 'desc');

  const filters = {
    search: req.query.search as string | undefined,
    isDelivered: req.query.isDelivered === 'true' ? true : req.query.isDelivered === 'false' ? false : undefined,
  };

  const { data, total } = await uniformService.listOrders(pagination, filters, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function createOrder(req: Request, res: Response) {
  const input = req.body as CreateOrderInput;
  const items = await uniformService.createOrder(input);
  successResponse(res, items, 201);
}

export async function updateOrder(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdateUniformInput;
  const item = await uniformService.updateUniform(id, input);
  successResponse(res, item);
}

export async function markDelivered(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const item = await uniformService.markDelivered(id);
  successResponse(res, item);
}

export async function deleteOrder(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const result = await uniformService.deleteUniform(id);
  successResponse(res, result);
}

export async function getStudentUniforms(req: Request<{ id: string }>, res: Response) {
  const studentId = parseInt(req.params.id, 10);
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(
    req.query as { sortBy?: string; sortDir?: string },
    ['orderDate', 'totalPrice', 'isDelivered', 'createdAt', 'catalogItem'],
    'createdAt',
    'desc',
  );

  const { data, total } = await uniformService.getStudentUniforms(studentId, pagination, sort);
  paginatedResponse(res, data, total, pagination);
}
