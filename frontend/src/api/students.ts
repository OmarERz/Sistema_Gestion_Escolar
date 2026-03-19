import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { Student, StudentFormData, UpdateStudentData, AcademicHistory } from '@/types/student';

export async function getStudents(
  page: number,
  limit: number,
  search?: string,
  status?: string,
  schoolCycleId?: number,
  groupId?: number,
  sortBy?: string,
  sortDir?: 'asc' | 'desc',
  noGroup?: boolean,
): Promise<PaginatedResponse<Student>> {
  const params: Record<string, unknown> = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  if (schoolCycleId) params.schoolCycleId = schoolCycleId;
  if (groupId) params.groupId = groupId;
  if (noGroup) params.noGroup = true;
  if (sortBy) params.sortBy = sortBy;
  if (sortDir) params.sortDir = sortDir;

  const { data } = await apiClient.get<PaginatedResponse<Student>>('/students', { params });
  return data;
}

export async function getStudentById(id: number): Promise<ApiResponse<Student>> {
  const { data } = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
  return data;
}

export async function createStudent(input: StudentFormData): Promise<Student> {
  const { data } = await apiClient.post<ApiResponse<Student>>('/students', input);
  return data.data;
}

export async function updateStudent(id: number, input: UpdateStudentData): Promise<Student> {
  const { data } = await apiClient.put<ApiResponse<Student>>(`/students/${id}`, input);
  return data.data;
}

export async function getStudentAcademicHistory(
  id: number,
): Promise<ApiResponse<AcademicHistory[]>> {
  const { data } = await apiClient.get<ApiResponse<AcademicHistory[]>>(
    `/students/${id}/academic-history`,
  );
  return data;
}
