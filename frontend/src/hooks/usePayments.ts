import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as paymentsApi from '@/api/payments';
import type { PaymentFormData, UpdatePaymentFormData, TransactionFormData } from '@/types/payment';

const QUERY_KEY = 'payments';
const STUDENT_PAYMENTS_KEY = 'studentPayments';
const DEBT_KEY = 'debtBreakdown';

export function usePayments(
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
) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, sortBy, sortDir, filters],
    queryFn: () => paymentsApi.getPayments(page, limit, sortBy, sortDir, filters),
  });
}

export function usePayment(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => paymentsApi.getPaymentById(id!),
    enabled: id !== null,
  });
}

export function useStudentPayments(
  studentId: number | null,
  page = 1,
  limit = 20,
  sortBy?: string,
  sortDir?: string,
  status?: string,
  schoolCycleId?: number,
) {
  return useQuery({
    queryKey: [STUDENT_PAYMENTS_KEY, studentId, page, limit, sortBy, sortDir, status, schoolCycleId],
    queryFn: () => paymentsApi.getStudentPayments(studentId!, page, limit, sortBy, sortDir, status, schoolCycleId),
    enabled: studentId !== null,
  });
}

export function useDebtBreakdown(studentId: number | null) {
  return useQuery({
    queryKey: [DEBT_KEY, studentId],
    queryFn: () => paymentsApi.getDebtBreakdown(studentId!),
    enabled: studentId !== null,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentFormData) => paymentsApi.createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePaymentFormData }) =>
      paymentsApi.updatePayment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.cancelPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: number; input: TransactionFormData }) =>
      paymentsApi.addTransaction(paymentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function useRemoveTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: number) => paymentsApi.removeTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function useBulkGenerate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, schoolCycleId }: { studentId: number; schoolCycleId: number }) =>
      paymentsApi.bulkGenerate(studentId, schoolCycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function useResetStudentPayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: number) => paymentsApi.resetStudentPayments(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}

export function usePayAllDebts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: number) => paymentsApi.payAllDebts(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useCheckOverdue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => paymentsApi.checkOverdue(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_PAYMENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEBT_KEY] });
    },
  });
}
