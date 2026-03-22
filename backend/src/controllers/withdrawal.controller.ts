/**
 * Withdrawal controller.
 * Handles HTTP requests for listing withdrawals, processing student withdrawals,
 * undoing withdrawals, and re-enrollment.
 */

import { Request, Response } from 'express';
import * as withdrawalService from '../services/withdrawal.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreateWithdrawalInput, ReenrollInput } from '../schemas/withdrawal.schema.js';

const SORTABLE_FIELDS = ['withdrawalDate', 'pendingDebtAtWithdrawal', 'createdAt', 'student'];

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, SORTABLE_FIELDS, 'withdrawalDate', 'desc');

  const filters = {
    search: req.query.search as string | undefined,
    schoolCycleId: req.query.schoolCycleId ? parseInt(req.query.schoolCycleId as string, 10) : undefined,
  };

  const { data, total } = await withdrawalService.listWithdrawals(pagination, filters, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function process(req: Request, res: Response) {
  const input = req.body as CreateWithdrawalInput;
  const withdrawal = await withdrawalService.processWithdrawal(input);
  successResponse(res, withdrawal, 201);
}

export async function undo(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const result = await withdrawalService.undoWithdrawal(id);
  successResponse(res, result);
}

export async function reenroll(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as ReenrollInput;
  const result = await withdrawalService.reenroll(id, input);
  successResponse(res, result);
}
