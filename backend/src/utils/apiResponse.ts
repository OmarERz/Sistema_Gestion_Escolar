import { Response } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortParams {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

/** Extracts page/limit from query params with defaults (page=1, limit=20) */
export function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

/** Extracts sortBy/sortDir from query params, validated against allowed fields */
export function parseSort(
  query: { sortBy?: string; sortDir?: string },
  allowedFields: string[],
  defaultField: string,
  defaultDir: 'asc' | 'desc' = 'asc',
): SortParams {
  const sortBy = allowedFields.includes(query.sortBy ?? '') ? query.sortBy! : defaultField;
  const sortDir = query.sortDir === 'desc' ? 'desc' : query.sortDir === 'asc' ? 'asc' : defaultDir;
  return { sortBy, sortDir };
}

export function successResponse(res: Response, data: unknown, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function paginatedResponse(
  res: Response,
  data: unknown,
  total: number,
  params: PaginationParams,
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    } satisfies PaginationMeta,
  });
}

export function errorResponse(res: Response, error: AppError) {
  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    details: error.details,
  });
}
