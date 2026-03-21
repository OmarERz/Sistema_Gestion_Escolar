import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type {
  Payment,
  PaymentFormData,
  UpdatePaymentFormData,
  TransactionFormData,
  DebtBreakdown,
  BulkGenerateResult,
} from '@/types/payment';

export async function getPayments(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: {
    search?: string;
    studentId?: number;
    paymentConceptId?: number;
    schoolCycleId?: number;
    status?: string;
  },
): Promise<PaginatedResponse<Payment>> {
  const { data } = await apiClient.get<PaginatedResponse<Payment>>('/payments', {
    params: { page, limit, sortBy, sortDir, ...filters },
  });
  return data;
}

export async function getPaymentById(id: number): Promise<Payment> {
  const { data } = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
  return data.data;
}

export async function createPayment(input: PaymentFormData): Promise<Payment> {
  const { data } = await apiClient.post<ApiResponse<Payment>>('/payments', input);
  return data.data;
}

export async function updatePayment(id: number, input: UpdatePaymentFormData): Promise<Payment> {
  const { data } = await apiClient.put<ApiResponse<Payment>>(`/payments/${id}`, input);
  return data.data;
}

export async function deletePayment(id: number): Promise<void> {
  await apiClient.delete(`/payments/${id}`);
}

export async function cancelPayment(id: number): Promise<Payment> {
  const { data } = await apiClient.patch<ApiResponse<Payment>>(`/payments/${id}/cancel`);
  return data.data;
}

export async function addTransaction(paymentId: number, input: TransactionFormData): Promise<Payment> {
  const { data } = await apiClient.post<ApiResponse<Payment>>(`/payments/${paymentId}/transactions`, input);
  return data.data;
}

export async function removeTransaction(transactionId: number): Promise<Payment> {
  const { data } = await apiClient.delete<ApiResponse<Payment>>(`/payments/transactions/${transactionId}`);
  return data.data;
}

export async function bulkGenerate(studentId: number, schoolCycleId: number): Promise<BulkGenerateResult> {
  const { data } = await apiClient.post<ApiResponse<BulkGenerateResult>>('/payments/bulk-generate', {
    studentId,
    schoolCycleId,
  });
  return data.data;
}

export async function resetStudentPayments(studentId: number): Promise<void> {
  await apiClient.delete(`/payments/student/${studentId}/reset`);
}

export async function checkOverdue(): Promise<{ updated: number }> {
  const { data } = await apiClient.post<ApiResponse<{ updated: number }>>('/payments/check-overdue');
  return data.data;
}

export async function getDebtBreakdown(studentId: number): Promise<DebtBreakdown> {
  const { data } = await apiClient.get<ApiResponse<DebtBreakdown>>(`/students/${studentId}/debt`);
  return data.data;
}

export async function getStudentPayments(
  studentId: number,
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  status?: string,
): Promise<PaginatedResponse<Payment>> {
  const { data } = await apiClient.get<PaginatedResponse<Payment>>(`/students/${studentId}/payments`, {
    params: { page, limit, sortBy, sortDir, status },
  });
  return data;
}
