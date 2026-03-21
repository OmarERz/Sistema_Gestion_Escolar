import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as recurringRulesApi from '@/api/recurringRules';
import type { RecurringRuleFormData } from '@/types/recurringRule';

const QUERY_KEY = 'recurringRules';

export function useRecurringRules(page = 1, limit = 20, sortBy?: string, sortDir?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, sortBy, sortDir],
    queryFn: () => recurringRulesApi.getRecurringRules(page, limit, sortBy, sortDir),
  });
}

export function useCreateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringRuleFormData) => recurringRulesApi.createRecurringRule(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<RecurringRuleFormData> & { isActive?: boolean } }) =>
      recurringRulesApi.updateRecurringRule(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recurringRulesApi.deleteRecurringRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useGeneratePayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recurringRulesApi.generatePayments(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['studentPayments'] });
      queryClient.invalidateQueries({ queryKey: ['debtBreakdown'] });
    },
  });
}
