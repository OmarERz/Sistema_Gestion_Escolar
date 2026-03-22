export interface RecurringPaymentRule {
  id: number;
  paymentConceptId: number;
  paymentConcept: { id: number; name: string; defaultAmount: number; isMonthly: boolean };
  schoolCycleId: number;
  schoolCycle: { id: number; name: string };
  generationDay: number;
  dueDay: number;
  startMonth: number;
  endMonth: number;
  amount: number | null;
  applyScholarship: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRuleFormData {
  paymentConceptId: number;
  schoolCycleId: number;
  generationDay: number;
  dueDay: number;
  startMonth: number;
  endMonth: number;
  amount?: number | null;
  applyScholarship?: boolean;
}

export interface GenerateResult {
  generated: number;
  skipped: number;
}
