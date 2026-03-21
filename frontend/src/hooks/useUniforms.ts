import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as uniformsApi from '@/api/uniforms';
import type { CreateCatalogData, UpdateCatalogData, CreateUniformOrderData, UpdateUniformData } from '@/types/uniform';

const CATALOG_KEY = 'uniformCatalog';
const ORDERS_KEY = 'uniformOrders';
const STUDENT_UNIFORMS_KEY = 'studentUniforms';

export function useUniformCatalog(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: { search?: string; isActive?: string },
) {
  return useQuery({
    queryKey: [CATALOG_KEY, page, limit, sortBy, sortDir, filters],
    queryFn: () => uniformsApi.getCatalog(page, limit, sortBy, sortDir, filters),
  });
}

export function useUniformOrders(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: { search?: string; isDelivered?: string },
) {
  return useQuery({
    queryKey: [ORDERS_KEY, page, limit, sortBy, sortDir, filters],
    queryFn: () => uniformsApi.getOrders(page, limit, sortBy, sortDir, filters),
  });
}

export function useStudentUniforms(
  studentId: number | null,
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
) {
  return useQuery({
    queryKey: [STUDENT_UNIFORMS_KEY, studentId, page, limit, sortBy, sortDir],
    queryFn: () => uniformsApi.getStudentUniforms(studentId!, page, limit, sortBy, sortDir),
    enabled: studentId !== null,
  });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCatalogData) => uniformsApi.createCatalogItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATALOG_KEY] });
    },
  });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateCatalogData }) =>
      uniformsApi.updateCatalogItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATALOG_KEY] });
    },
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => uniformsApi.deleteCatalogItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATALOG_KEY] });
    },
  });
}

export function useCreateUniformOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUniformOrderData) => uniformsApi.createOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_UNIFORMS_KEY] });
    },
  });
}

export function useUpdateUniform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUniformData }) =>
      uniformsApi.updateUniform(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_UNIFORMS_KEY] });
    },
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => uniformsApi.markDelivered(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_UNIFORMS_KEY] });
    },
  });
}

export function useDeleteUniform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => uniformsApi.deleteUniform(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_UNIFORMS_KEY] });
    },
  });
}
