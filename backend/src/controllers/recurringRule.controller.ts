/**
 * Recurring payment rule controller.
 * Handles HTTP requests for recurring rule CRUD and manual payment generation trigger.
 */

import { Request, Response } from 'express';
import * as recurringRuleService from '../services/recurringRule.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreateRecurringRuleInput, UpdateRecurringRuleInput } from '../schemas/recurringRule.schema.js';

const SORTABLE_FIELDS = ['paymentConceptId', 'schoolCycleId', 'generationDay', 'dueDay', 'startMonth', 'isActive', 'createdAt'];

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, SORTABLE_FIELDS, 'createdAt', 'desc');

  const { data, total } = await recurringRuleService.list(pagination, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateRecurringRuleInput;
  const rule = await recurringRuleService.create(input);
  successResponse(res, rule, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdateRecurringRuleInput;
  const rule = await recurringRuleService.update(id, input);
  successResponse(res, rule);
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const result = await recurringRuleService.remove(id);
  successResponse(res, result);
}

export async function generate(_req: Request, res: Response) {
  const result = await recurringRuleService.generatePayments();
  successResponse(res, result);
}
