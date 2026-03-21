import apiClient from './client';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { RecurringPaymentRule, RecurringRuleFormData, GenerateResult } from '@/types/recurringRule';

export async function getRecurringRules(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
): Promise<PaginatedResponse<RecurringPaymentRule>> {
  const { data } = await apiClient.get<PaginatedResponse<RecurringPaymentRule>>('/recurring-rules', {
    params: { page, limit, sortBy, sortDir },
  });
  return data;
}

export async function createRecurringRule(input: RecurringRuleFormData): Promise<RecurringPaymentRule> {
  const { data } = await apiClient.post<ApiResponse<RecurringPaymentRule>>('/recurring-rules', input);
  return data.data;
}

export async function updateRecurringRule(
  id: number,
  input: Partial<RecurringRuleFormData> & { isActive?: boolean },
): Promise<RecurringPaymentRule> {
  const { data } = await apiClient.put<ApiResponse<RecurringPaymentRule>>(`/recurring-rules/${id}`, input);
  return data.data;
}

export async function deleteRecurringRule(id: number): Promise<void> {
  await apiClient.delete(`/recurring-rules/${id}`);
}

export async function generatePayments(): Promise<GenerateResult> {
  const { data } = await apiClient.post<ApiResponse<GenerateResult>>('/recurring-rules/generate');
  return data.data;
}
