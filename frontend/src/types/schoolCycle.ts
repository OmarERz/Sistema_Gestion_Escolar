export interface SchoolCycle {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolCycleFormData {
  name: string;
  startDate: string;
  endDate: string;
}
