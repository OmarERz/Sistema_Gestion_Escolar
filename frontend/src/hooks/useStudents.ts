import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as studentsApi from '@/api/students';
import type { StudentFormData, UpdateStudentData, GuardianFormData } from '@/types/student';

export function useStudents(
  page: number,
  limit: number,
  search?: string,
  status?: string,
  schoolCycleId?: number,
  groupId?: number,
  sortBy?: string,
  sortDir?: 'asc' | 'desc',
  noGroup?: boolean,
) {
  return useQuery({
    queryKey: ['students', page, limit, search, status, schoolCycleId, groupId, sortBy, sortDir, noGroup],
    queryFn: () =>
      studentsApi.getStudents(page, limit, search, status, schoolCycleId, groupId, sortBy, sortDir, noGroup),
    staleTime: 30000,
  });
}

export function useStudentById(id: number) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getStudentById(id),
    staleTime: 30000,
  });
}

export function useStudentAcademicHistory(id: number) {
  return useQuery({
    queryKey: ['student-academic-history', id],
    queryFn: () => studentsApi.getStudentAcademicHistory(id),
    staleTime: 30000,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StudentFormData) => studentsApi.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentData }) =>
      studentsApi.updateStudent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useAddGuardianToStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: number; data: Omit<GuardianFormData, 'fiscalData'> }) =>
      studentsApi.addGuardianToStudent(studentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
    },
  });
}
