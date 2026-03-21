/**
 * Payment concept controller.
 * Handles HTTP requests for payment concept CRUD operations.
 */

import { Request, Response } from 'express';
import * as paymentConceptService from '../services/paymentConcept.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreatePaymentConceptInput, UpdatePaymentConceptInput } from '../schemas/paymentConcept.schema.js';

const SORTABLE_FIELDS = ['name', 'type', 'defaultAmount', 'isMonthly', 'isActive'];

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, SORTABLE_FIELDS, 'name', 'asc');
  const { data, total } = await paymentConceptService.list(pagination, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreatePaymentConceptInput;
  const concept = await paymentConceptService.create(input);
  successResponse(res, concept, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdatePaymentConceptInput;
  const concept = await paymentConceptService.update(id, input);
  successResponse(res, concept);
}
