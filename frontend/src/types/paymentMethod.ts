export interface PaymentMethod {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodFormData {
  name: string;
}
