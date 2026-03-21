import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as guardiansApi from '@/api/guardians';
import type { GuardianData, FiscalDataFormData } from '@/types/student';

export function useGuardians(
  page: number,
  limit: number,
  search?: string,
  status?: string,
  sortBy?: string,
  sortDir?: 'asc' | 'desc',
) {
  return useQuery({
    queryKey: ['guardians', page, limit, search, status, sortBy, sortDir],
    queryFn: () => guardiansApi.getGuardians(page, limit, search, status, sortBy, sortDir),
    staleTime: 30000,
  });
}

export function useGuardianById(id: number) {
  return useQuery({
    queryKey: ['guardian', id],
    queryFn: () => guardiansApi.getGuardianById(id),
    staleTime: 30000,
  });
}

export function useCheckDuplicateGuardian(
  phone?: string,
  phoneSecondary?: string,
  email?: string,
) {
  return useQuery({
    queryKey: ['guardian-duplicate-check', phone, phoneSecondary, email],
    queryFn: () => guardiansApi.checkDuplicateGuardian(phone, phoneSecondary, email),
    enabled: !!(phone || phoneSecondary || email),
    staleTime: 0,
  });
}

export function useCreateGuardian() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GuardianData) => guardiansApi.createGuardian(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
    },
  });
}

export function useUpdateGuardian() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GuardianData }) =>
      guardiansApi.updateGuardian(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardian', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
    },
  });
}

export function useUpsertFiscalData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, data }: { guardianId: number; data: FiscalDataFormData }) =>
      guardiansApi.upsertFiscalData(guardianId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardian', variables.guardianId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUnlinkStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, studentId }: { guardianId: number; studentId: number }) =>
      guardiansApi.unlinkStudent(guardianId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardian', variables.guardianId] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateGuardianLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      guardianId,
      studentId,
      data,
    }: {
      guardianId: number;
      studentId: number;
      data: { relationship?: string; isPrimary?: boolean };
    }) => guardiansApi.updateGuardianLink(guardianId, studentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guardian', variables.guardianId] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
