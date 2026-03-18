import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { SchoolCycle, SchoolCycleFormData } from '@/types/schoolCycle';

export async function getSchoolCycles(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResponse<SchoolCycle>> {
  const { data } = await apiClient.get<PaginatedResponse<SchoolCycle>>(
    '/school-cycles',
    { params: { page, limit, sortBy, sortDir } },
  );
  return data;
}

export async function createSchoolCycle(input: SchoolCycleFormData): Promise<SchoolCycle> {
  const { data } = await apiClient.post<ApiResponse<SchoolCycle>>('/school-cycles', input);
  return data.data;
}

export async function updateSchoolCycle(id: number, input: SchoolCycleFormData): Promise<SchoolCycle> {
  const { data } = await apiClient.put<ApiResponse<SchoolCycle>>(`/school-cycles/${id}`, input);
  return data.data;
}

export async function activateSchoolCycle(id: number): Promise<void> {
  await apiClient.patch(`/school-cycles/${id}/activate`);
}
