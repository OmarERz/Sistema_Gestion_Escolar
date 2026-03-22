/**
 * Payment controller.
 * Handles HTTP requests for payment CRUD, transactions, bulk generation,
 * student payment reset, overdue checks, and debt breakdown.
 */

import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service.js';
import { successResponse, paginatedResponse, parsePagination, parseSort } from '../utils/apiResponse.js';
import type { CreatePaymentInput, UpdatePaymentInput, CreateTransactionInput, BulkGenerateInput } from '../schemas/payment.schema.js';

const SORTABLE_FIELDS = ['studentId', 'paymentConceptId', 'finalAmount', 'amountPaid', 'status', 'dueDate', 'createdAt', 'student'];

export async function list(req: Request, res: Response) {
  const pagination = parsePagination(req.query as { page?: string; limit?: string });
  const sort = parseSort(req.query as { sortBy?: string; sortDir?: string }, SORTABLE_FIELDS, 'createdAt', 'desc');

  const filters = {
    search: req.query.search as string | undefined,
    studentId: req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined,
    paymentConceptId: req.query.paymentConceptId ? parseInt(req.query.paymentConceptId as string, 10) : undefined,
    schoolCycleId: req.query.schoolCycleId ? parseInt(req.query.schoolCycleId as string, 10) : undefined,
    status: req.query.status as string | undefined,
  };

  const { data, total } = await paymentService.list(pagination, filters, sort);
  paginatedResponse(res, data, total, pagination);
}

export async function getById(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const payment = await paymentService.getById(id);
  successResponse(res, payment);
}

export async function create(req: Request, res: Response) {
  const input = req.body as CreatePaymentInput;
  const payment = await paymentService.create(input);
  successResponse(res, payment, 201);
}

export async function update(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const input = req.body as UpdatePaymentInput;
  const payment = await paymentService.update(id, input);
  successResponse(res, payment);
}

export async function remove(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const result = await paymentService.remove(id);
  successResponse(res, result);
}

export async function cancel(req: Request<{ id: string }>, res: Response) {
  const id = parseInt(req.params.id, 10);
  const payment = await paymentService.cancel(id);
  successResponse(res, payment);
}

export async function addTransaction(req: Request<{ id: string }>, res: Response) {
  const paymentId = parseInt(req.params.id, 10);
  const input = req.body as CreateTransactionInput;
  const payment = await paymentService.addTransaction(paymentId, input);
  successResponse(res, payment, 201);
}

export async function removeTransaction(req: Request<{ id: string }>, res: Response) {
  const transactionId = parseInt(req.params.id, 10);
  const payment = await paymentService.removeTransaction(transactionId);
  successResponse(res, payment);
}

export async function bulkGenerate(req: Request, res: Response) {
  const input = req.body as BulkGenerateInput;
  const result = await paymentService.bulkGenerateMandatory(input.studentId, input.schoolCycleId);
  successResponse(res, result, 201);
}

export async function resetStudentPayments(req: Request<{ id: string }>, res: Response) {
  const studentId = parseInt(req.params.id, 10);
  const result = await paymentService.resetStudentPayments(studentId);
  successResponse(res, result);
}

export async function payAllDebts(req: Request<{ id: string }>, res: Response) {
  const studentId = parseInt(req.params.id, 10);
  const result = await paymentService.payAllDebts(studentId);
  successResponse(res, result);
}

export async function checkOverdue(_req: Request, res: Response) {
  const result = await paymentService.checkOverdue();
  successResponse(res, result);
}

export async function getDebtBreakdown(req: Request<{ id: string }>, res: Response) {
  const studentId = parseInt(req.params.id, 10);
  const result = await paymentService.getDebtBreakdown(studentId);
  successResponse(res, result);
}
