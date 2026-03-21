export interface PaymentTransaction {
  id: number;
  paymentId: number;
  amount: number;
  paymentMethodId: number;
  paymentMethod: { id: number; name: string };
  paymentDate: string;
  receiptNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Payment {
  id: number;
  studentId: number;
  student: { id: number; firstName: string; lastName1: string; lastName2: string | null };
  paymentConceptId: number;
  paymentConcept: { id: number; name: string; type: 'mandatory' | 'optional' };
  schoolCycleId: number;
  schoolCycle: { id: number; name: string };
  appliesToMonth: number | null;
  baseAmount: number;
  discountPercent: number;
  surchargePercent: number;
  finalAmount: number;
  amountPaid: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  dueDate: string | null;
  notes: string | null;
  transactions: PaymentTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  studentId: number;
  paymentConceptId: number;
  schoolCycleId: number;
  appliesToMonth?: number | null;
  baseAmount: number;
  discountPercent: number;
  surchargePercent: number;
  dueDate?: string | null;
  notes?: string | null;
  transaction?: {
    amount: number;
    paymentMethodId: number;
    paymentDate?: string;
    receiptNumber?: string | null;
    notes?: string | null;
  };
}

export interface UpdatePaymentFormData {
  baseAmount?: number;
  discountPercent?: number;
  surchargePercent?: number;
  dueDate?: string | null;
  notes?: string | null;
  status?: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
}

export interface TransactionFormData {
  amount: number;
  paymentMethodId: number;
  paymentDate?: string;
  receiptNumber?: string | null;
  notes?: string | null;
}

export interface DebtBreakdown {
  totalDebt: number;
  concepts: {
    conceptId: number;
    conceptName: string;
    totalOwed: number;
    totalPaid: number;
    balance: number;
  }[];
}

export interface BulkGenerateResult {
  generated: number;
  skipped: number;
}
