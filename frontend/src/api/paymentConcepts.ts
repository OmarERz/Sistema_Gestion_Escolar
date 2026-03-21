import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { PaymentConcept, PaymentConceptFormData } from '@/types/paymentConcept';

export async function getPaymentConcepts(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResponse<PaymentConcept>> {
  const { data } = await apiClient.get<PaginatedResponse<PaymentConcept>>(
    '/payment-concepts',
    { params: { page, limit, sortBy, sortDir } },
  );
  return data;
}

export async function createPaymentConcept(input: PaymentConceptFormData): Promise<PaymentConcept> {
  const { data } = await apiClient.post<ApiResponse<PaymentConcept>>('/payment-concepts', input);
  return data.data;
}

export async function updatePaymentConcept(
  id: number,
  input: PaymentConceptFormData & { isActive: boolean },
): Promise<PaymentConcept> {
  const { data } = await apiClient.put<ApiResponse<PaymentConcept>>(`/payment-concepts/${id}`, input);
  return data.data;
}
