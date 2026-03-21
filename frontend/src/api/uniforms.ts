import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type {
  UniformCatalogItem,
  Uniform,
  CreateCatalogData,
  UpdateCatalogData,
  CreateUniformOrderData,
  UpdateUniformData,
} from '@/types/uniform';

// --------------- Catalog ---------------

export async function getCatalog(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: { search?: string; isActive?: string },
): Promise<PaginatedResponse<UniformCatalogItem>> {
  const { data } = await apiClient.get<PaginatedResponse<UniformCatalogItem>>('/uniforms/catalog', {
    params: { page, limit, sortBy, sortDir, ...filters },
  });
  return data;
}

export async function createCatalogItem(input: CreateCatalogData): Promise<UniformCatalogItem> {
  const { data } = await apiClient.post<ApiResponse<UniformCatalogItem>>('/uniforms/catalog', input);
  return data.data;
}

export async function updateCatalogItem(id: number, input: UpdateCatalogData): Promise<UniformCatalogItem> {
  const { data } = await apiClient.put<ApiResponse<UniformCatalogItem>>(`/uniforms/catalog/${id}`, input);
  return data.data;
}

export async function deleteCatalogItem(id: number): Promise<void> {
  await apiClient.delete(`/uniforms/catalog/${id}`);
}

// --------------- Orders ---------------

export async function getOrders(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: { search?: string; isDelivered?: string },
): Promise<PaginatedResponse<Uniform>> {
  const { data } = await apiClient.get<PaginatedResponse<Uniform>>('/uniforms/orders', {
    params: { page, limit, sortBy, sortDir, ...filters },
  });
  return data;
}

export async function createOrder(input: CreateUniformOrderData): Promise<Uniform[]> {
  const { data } = await apiClient.post<ApiResponse<Uniform[]>>('/uniforms/orders', input);
  return data.data;
}

export async function updateUniform(id: number, input: UpdateUniformData): Promise<Uniform> {
  const { data } = await apiClient.put<ApiResponse<Uniform>>(`/uniforms/orders/${id}`, input);
  return data.data;
}

export async function markDelivered(id: number): Promise<Uniform> {
  const { data } = await apiClient.patch<ApiResponse<Uniform>>(`/uniforms/orders/${id}/deliver`);
  return data.data;
}

export async function deleteUniform(id: number): Promise<void> {
  await apiClient.delete(`/uniforms/orders/${id}`);
}

// --------------- Student Uniforms ---------------

export async function getStudentUniforms(
  studentId: number,
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResponse<Uniform>> {
  const { data } = await apiClient.get<PaginatedResponse<Uniform>>(`/students/${studentId}/uniforms`, {
    params: { page, limit, sortBy, sortDir },
  });
  return data;
}
