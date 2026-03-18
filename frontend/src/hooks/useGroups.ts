import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupsApi from '@/api/groups';
import type { GroupFormData } from '@/types/group';

const QUERY_KEY = 'groups';

export function useGroups(page = 1, limit = 20, schoolCycleId?: number) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, schoolCycleId],
    queryFn: () => groupsApi.getGroups(page, limit, schoolCycleId),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GroupFormData) => groupsApi.createGroup(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: GroupFormData }) =>
      groupsApi.updateGroup(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useEmptyGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => groupsApi.emptyGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => groupsApi.deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
