export interface Group {
  id: number;
  name: string;
  level: 'kinder' | 'primaria' | 'secundaria' | 'prepa';
  grade: string;
  section: string;
  promotionOrder: number;
  schoolCycleId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schoolCycle: { name: string };
  _count: { students: number };
}

export interface GroupFormData {
  schoolCycleId: number;
  level: 'kinder' | 'primaria' | 'secundaria' | 'prepa';
  grade: string;
  section: string;
}
