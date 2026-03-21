export interface PaymentConcept {
  id: number;
  name: string;
  type: 'mandatory' | 'optional';
  defaultAmount: number;
  isMonthly: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentConceptFormData {
  name: string;
  type: 'mandatory' | 'optional';
  defaultAmount: number;
  isMonthly: boolean;
}
