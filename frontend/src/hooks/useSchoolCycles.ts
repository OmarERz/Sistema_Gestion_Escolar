import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as schoolCyclesApi from '@/api/schoolCycles';
import type { SchoolCycleFormData } from '@/types/schoolCycle';

const QUERY_KEY = 'schoolCycles';

export function useSchoolCycles(page = 1, limit = 20) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: () => schoolCyclesApi.getSchoolCycles(page, limit),
  });
}

export function useCreateSchoolCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SchoolCycleFormData) => schoolCyclesApi.createSchoolCycle(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateSchoolCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SchoolCycleFormData }) =>
      schoolCyclesApi.updateSchoolCycle(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useActivateSchoolCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => schoolCyclesApi.activateSchoolCycle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
