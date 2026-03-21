import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { PaymentMethod, PaymentMethodFormData } from '@/types/paymentMethod';

export async function getPaymentMethods(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResponse<PaymentMethod>> {
  const { data } = await apiClient.get<PaginatedResponse<PaymentMethod>>(
    '/payment-methods',
    { params: { page, limit, sortBy, sortDir } },
  );
  return data;
}

export async function createPaymentMethod(input: PaymentMethodFormData): Promise<PaymentMethod> {
  const { data } = await apiClient.post<ApiResponse<PaymentMethod>>('/payment-methods', input);
  return data.data;
}

export async function updatePaymentMethod(
  id: number,
  input: PaymentMethodFormData & { isActive: boolean },
): Promise<PaymentMethod> {
  const { data } = await apiClient.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, input);
  return data.data;
}
