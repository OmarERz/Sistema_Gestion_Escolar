import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as paymentConceptsApi from '@/api/paymentConcepts';
import type { PaymentConceptFormData } from '@/types/paymentConcept';

const QUERY_KEY = 'paymentConcepts';

export function usePaymentConcepts(page = 1, limit = 20, sortBy?: string, sortDir?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, sortBy, sortDir],
    queryFn: () => paymentConceptsApi.getPaymentConcepts(page, limit, sortBy, sortDir),
  });
}

export function useCreatePaymentConcept() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentConceptFormData) => paymentConceptsApi.createPaymentConcept(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdatePaymentConcept() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PaymentConceptFormData & { isActive: boolean } }) =>
      paymentConceptsApi.updatePaymentConcept(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
