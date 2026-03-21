/**
 * Payment method controller.
 * Handles HTTP requests for payment method CRUD operations.
 */

import { Request, Response } from 'express';
import * as paymentMethodService from '../services/paymentMethod.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../schemas/paymentMethod.schema.js';

const SORTABLE_FIELDS = ['name', 'isActive'];

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, SORTABLE_FIELDS, 'name', 'asc');
  const { data, total } = await paymentMethodService.list(pagination, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreatePaymentMethodInput;
  const method = await paymentMethodService.create(input);
  successResponse(res, method, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdatePaymentMethodInput;
  const method = await paymentMethodService.update(id, input);
  successResponse(res, method);
}
