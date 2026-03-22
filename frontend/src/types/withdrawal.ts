export interface Withdrawal {
  id: number;
  studentId: number;
  student: {
    id: number;
    firstName: string;
    lastName1: string;
    lastName2: string | null;
    group: { id: number; name: string; level: string } | null;
  };
  withdrawalDate: string;
  reason: string;
  pendingDebtAtWithdrawal: string | number;
  schoolCycleId: number;
  schoolCycle: { id: number; name: string };
  createdAt: string;
}

export interface CreateWithdrawalData {
  studentId: number;
  reason: string;
  withdrawalDate?: string;
}

export interface ReenrollData {
  groupId: number;
  schoolCycleId: number;
  enrollmentDate?: string;
  keepGuardianIds?: number[];
  addGuardianIds?: number[];
}
