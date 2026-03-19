import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { Guardian, GuardianData, FiscalDataFormData } from '@/types/student';

export interface DuplicateCheckResult {
  exists: boolean;
  guardians: Array<{
    id: number;
    firstName: string;
    lastName1: string;
    lastName2?: string | null;
    email?: string | null;
    phone: string;
    phoneSecondary?: string | null;
  }>;
}

export async function getGuardians(
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  sortDir?: 'asc' | 'desc',
): Promise<PaginatedResponse<Guardian>> {
  const params: Record<string, unknown> = { page, limit };
  if (search) params.search = search;
  if (sortBy) params.sortBy = sortBy;
  if (sortDir) params.sortDir = sortDir;

  const { data } = await apiClient.get<PaginatedResponse<Guardian>>('/guardians', { params });
  return data;
}

export async function getGuardianById(id: number): Promise<ApiResponse<Guardian>> {
  const { data } = await apiClient.get<ApiResponse<Guardian>>(`/guardians/${id}`);
  return data;
}

export async function createGuardian(input: GuardianData): Promise<Guardian> {
  const { data } = await apiClient.post<ApiResponse<Guardian>>('/guardians', input);
  return data.data;
}

export async function updateGuardian(id: number, input: GuardianData): Promise<Guardian> {
  const { data } = await apiClient.put<ApiResponse<Guardian>>(`/guardians/${id}`, input);
  return data.data;
}

export async function checkDuplicateGuardian(
  phone?: string,
  phoneSecondary?: string,
  email?: string,
): Promise<DuplicateCheckResult> {
  const params: Record<string, unknown> = {};
  if (phone) params.phone = phone;
  if (phoneSecondary) params.phoneSecondary = phoneSecondary;
  if (email) params.email = email;

  const { data } = await apiClient.get<ApiResponse<DuplicateCheckResult>>(
    '/guardians/check-duplicate',
    { params },
  );
  return data.data;
}

export async function upsertFiscalData(
  guardianId: number,
  input: FiscalDataFormData,
): Promise<void> {
  await apiClient.post(`/guardians/${guardianId}/fiscal-data`, input);
}
