/**
 * Student controller.
 * Handles HTTP requests for student CRUD, academic history, and placeholder endpoints
 * for payments/uniforms/debt (wired in later steps).
 */

import { Request, Response } from 'express';
import * as studentService from '../services/student.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreateStudentInput, UpdateStudentInput, GuardianInput } from '../schemas/student.schema.js';

const SORTABLE_FIELDS = ['firstName', 'lastName1', 'enrollmentDate', 'totalDebt', 'status', 'group'];

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, SORTABLE_FIELDS, 'lastName1');

  const filters = {
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    schoolCycleId: req.query.schoolCycleId ? parseInt(req.query.schoolCycleId as string, 10) : undefined,
    groupId: req.query.groupId ? parseInt(req.query.groupId as string, 10) : undefined,
    noGroup: req.query.noGroup === 'true',
  };

  const { data, total } = await studentService.list(pagination, filters, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function getById(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const student = await studentService.getById(id);
  successResponse(res, student);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreateStudentInput;
  const student = await studentService.create(input);
  successResponse(res, student, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdateStudentInput;
  const student = await studentService.update(id, input);
  successResponse(res, student);
}

export async function getAcademicHistory(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const history = await studentService.getAcademicHistory(id);
  successResponse(res, history);
}

export async function addGuardian(req: Request<{ id: string }>, res: Response) {
  const studentId = parseInt(req.params.id, 10);
  const input = req.body as GuardianInput;
  const student = await studentService.addGuardian(studentId, input);
  successResponse(res, student, 201);
}

// Placeholder endpoints — will be connected in later steps
export async function getPayments(req: Request<{ id: string }>, res: Response) {
  successResponse(res, []);
}

export async function getUniforms(req: Request<{ id: string }>, res: Response) {
  successResponse(res, []);
}

export async function getDebt(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const student = await studentService.getById(id);
  successResponse(res, { totalDebt: student.totalDebt, concepts: [] });
}
