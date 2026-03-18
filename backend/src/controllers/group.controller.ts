/**
 * Group controller.
 * Handles HTTP requests for group CRUD, emptying, and deletion.
 */

import { Request, Response } from 'express';
import * as groupService from '../services/group.service.js';
import { successResponse, paginatedResponse, parsePagination } from '../utils/apiResponse.js';
import type { CreateGroupInput, UpdateGroupInput } from '../schemas/group.schema.js';

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const schoolCycleId = req.query.schoolCycleId
    ? parseInt(req.query.schoolCycleId as string, 10)
    : undefined;

  const { data, total } = await groupService.list(pagination, { schoolCycleId });
  paginatedResponse(res, data, total, pagination);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateGroupInput;
  const group = await groupService.create(input);
  successResponse(res, group, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdateGroupInput;
  const group = await groupService.update(id, input);
  successResponse(res, group);
}

export async function empty(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const result = await groupService.empty(id);
  successResponse(res, result);
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  await groupService.remove(id);
  successResponse(res, { message: 'Group deleted' });
}
