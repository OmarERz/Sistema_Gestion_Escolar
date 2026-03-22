import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as withdrawalsApi from '@/api/withdrawals';
import type { CreateWithdrawalData, ReenrollData } from '@/types/withdrawal';

const WITHDRAWALS_KEY = 'withdrawals';

export function useWithdrawals(
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  filters?: { search?: string; schoolCycleId?: number },
) {
  return useQuery({
    queryKey: [WITHDRAWALS_KEY, page, limit, sortBy, sortDir, filters],
    queryFn: () => withdrawalsApi.getWithdrawals(page, limit, sortBy, sortDir, filters),
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWithdrawalData) => withdrawalsApi.createWithdrawal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WITHDRAWALS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUndoWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withdrawalsApi.undoWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WITHDRAWALS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useReenroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ReenrollData }) =>
      withdrawalsApi.reenroll(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WITHDRAWALS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
