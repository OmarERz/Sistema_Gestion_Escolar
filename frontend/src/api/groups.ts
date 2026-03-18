import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { Group, GroupFormData } from '@/types/group';

export async function getGroups(
  page = 1,
  limit = 20,
  schoolCycleId?: number,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResponse<Group>> {
  const { data } = await apiClient.get<PaginatedResponse<Group>>('/groups', {
    params: { page, limit, ...(schoolCycleId && { schoolCycleId }), sortBy, sortDir },
  });
  return data;
}

export async function createGroup(input: GroupFormData): Promise<Group> {
  const { data } = await apiClient.post<ApiResponse<Group>>('/groups', input);
  return data.data;
}

export async function updateGroup(id: number, input: GroupFormData): Promise<Group> {
  const { data } = await apiClient.put<ApiResponse<Group>>(`/groups/${id}`, input);
  return data.data;
}

export async function emptyGroup(id: number): Promise<{ removedCount: number }> {
  const { data } = await apiClient.patch<ApiResponse<{ removedCount: number }>>(
    `/groups/${id}/empty`,
  );
  return data.data;
}

export async function deleteGroup(id: number): Promise<void> {
  await apiClient.delete(`/groups/${id}`);
}
