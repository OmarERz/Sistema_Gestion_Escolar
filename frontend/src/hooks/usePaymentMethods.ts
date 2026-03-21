import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as paymentMethodsApi from '@/api/paymentMethods';
import type { PaymentMethodFormData } from '@/types/paymentMethod';

const QUERY_KEY = 'paymentMethods';

export function usePaymentMethods(page = 1, limit = 20, sortBy?: string, sortDir?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, sortBy, sortDir],
    queryFn: () => paymentMethodsApi.getPaymentMethods(page, limit, sortBy, sortDir),
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentMethodFormData) => paymentMethodsApi.createPaymentMethod(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PaymentMethodFormData & { isActive: boolean } }) =>
      paymentMethodsApi.updatePaymentMethod(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
