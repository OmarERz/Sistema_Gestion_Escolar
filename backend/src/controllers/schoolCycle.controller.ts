/**
 * School cycle controller.
 * Handles HTTP requests for school cycle CRUD and activation.
 */

import { Request, Response } from 'express';
import * as schoolCycleService from '../services/schoolCycle.service.js';
import { successResponse, paginatedResponse, parsePagination } from '../utils/apiResponse.js';
import type { CreateSchoolCycleInput, UpdateSchoolCycleInput } from '../schemas/schoolCycle.schema.js';

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const { data, total } = await schoolCycleService.list(pagination);
  paginatedResponse(res, data, total, pagination);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateSchoolCycleInput;
  const cycle = await schoolCycleService.create(input);
  successResponse(res, cycle, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdateSchoolCycleInput;
  const cycle = await schoolCycleService.update(id, input);
  successResponse(res, cycle);
}

export async function activate(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  await schoolCycleService.activate(id);
  successResponse(res, { message: 'Cycle activated' });
}
