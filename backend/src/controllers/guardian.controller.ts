/**
 * Guardian controller.
 * Handles HTTP requests for guardian CRUD, duplicate checking, and fiscal data upsert.
 */

import { Request, Response } from 'express';
import * as guardianService from '../services/guardian.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreateGuardianInput, UpdateGuardianInput, FiscalDataInput, UpdateStudentLinkInput } from '../schemas/guardian.schema.js';

const SORTABLE_FIELDS = ['firstName', 'lastName1', 'phone', 'email'];

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, SORTABLE_FIELDS, 'lastName1');

  const statusParam = req.query.status as string | undefined;
  const filters = {
    search: req.query.search as string | undefined,
    status: (statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined) as 'active' | 'inactive' | undefined,
  };

  const { data, total } = await guardianService.list(pagination, filters, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function getById(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const guardian = await guardianService.getById(id);
  successResponse(res, guardian);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateGuardianInput;
  const guardian = await guardianService.create(input);
  successResponse(res, guardian, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdateGuardianInput;
  const guardian = await guardianService.update(id, input);
  successResponse(res, guardian);
}

export async function checkDuplicate(req: Request, res: Response) {
  const phone = req.query.phone as string | undefined;
  const phoneSecondary = req.query.phoneSecondary as string | undefined;
  const email = req.query.email as string | undefined;
  const result = await guardianService.checkDuplicate(phone, phoneSecondary, email);
  successResponse(res, result);
}

export async function upsertFiscalData(req: Request<{ id: string }>, res: Response) {
  const guardianId = parseInt(req.params.id, 10);
  const input = req.body as FiscalDataInput;
  const fiscalData = await guardianService.upsertFiscalData(guardianId, input);
  successResponse(res, fiscalData);
}

export async function unlinkStudent(req: Request<{ id: string; studentId: string }>, res: Response) {
  const guardianId = parseInt(req.params.id, 10);
  const studentId = parseInt(req.params.studentId, 10);
  await guardianService.unlinkStudent(guardianId, studentId);
  successResponse(res, { message: 'Student unlinked successfully' });
}

export async function updateStudentLink(req: Request<{ id: string; studentId: string }>, res: Response) {
  const guardianId = parseInt(req.params.id, 10);
  const studentId = parseInt(req.params.studentId, 10);
  const input = req.body as UpdateStudentLinkInput;
  await guardianService.updateStudentLink(guardianId, studentId, input);
  successResponse(res, { message: 'Link updated successfully' });
}
