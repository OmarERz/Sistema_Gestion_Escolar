import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { Withdrawal, CreateWithdrawalData, ReenrollData } from '@/types/withdrawal';

export async function getWithdrawals(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: { search?: string; schoolCycleId?: number },
): Promise<PaginatedResponse<Withdrawal>> {
  const { data } = await apiClient.get<PaginatedResponse<Withdrawal>>('/withdrawals', {
    params: { page, limit, sortBy, sortDir, ...filters },
  });
  return data;
}

export async function createWithdrawal(input: CreateWithdrawalData): Promise<Withdrawal> {
  const { data } = await apiClient.post<ApiResponse<Withdrawal>>('/withdrawals', input);
  return data.data;
}

export async function undoWithdrawal(id: number): Promise<{ undone: boolean }> {
  const { data } = await apiClient.post<ApiResponse<{ undone: boolean }>>(`/withdrawals/${id}/undo`);
  return data.data;
}

export async function reenroll(id: number, input: ReenrollData): Promise<unknown> {
  const { data } = await apiClient.post<ApiResponse<unknown>>(`/withdrawals/${id}/reenroll`, input);
  return data.data;
}
