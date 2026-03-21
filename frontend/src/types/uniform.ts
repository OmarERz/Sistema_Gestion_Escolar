export interface UniformCatalogItem {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Uniform {
  id: number;
  studentId: number;
  student: { id: number; firstName: string; lastName1: string; lastName2: string | null };
  uniformCatalogId: number;
  uniformCatalog: { id: number; name: string };
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isDelivered: boolean;
  deliveryDate: string | null;
  orderDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogData {
  name: string;
  description?: string | null;
  basePrice: number;
}

export interface UpdateCatalogData {
  name?: string;
  description?: string | null;
  basePrice?: number;
  isActive?: boolean;
}

export interface UpdateUniformData {
  size?: string;
  quantity?: number;
  notes?: string | null;
}

export interface CreateUniformOrderData {
  studentId: number;
  orderDate?: string;
  notes?: string | null;
  items: {
    uniformCatalogId: number;
    size: string;
    quantity: number;
  }[];
}
