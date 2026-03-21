export interface Guardian {
  id: number;
  firstName: string;
  lastName1: string;
  lastName2?: string | null;
  email?: string | null;
  phone: string;
  phoneSecondary?: string | null;
  address?: string | null;
  fiscalData?: FiscalData | null;
  students?: GuardianStudentLink[];
}

/** Linked student as returned by GET /api/guardians and GET /api/guardians/:id */
export interface GuardianStudentLink {
  student: {
    id: number;
    firstName: string;
    lastName1: string;
    lastName2?: string | null;
    status: string;
    group?: { id: number; name: string; level: string } | null;
    _count?: { guardians: number };
  };
  relationship: string;
  isPrimary: boolean;
}

export interface FiscalData {
  id: number;
  guardianId: number;
  rfc: string;
  businessName: string;
  cfdiUsage: string;
  fiscalRegime?: string | null;
  fiscalAddressStreet: string;
  fiscalAddressExtNumber?: string | null;
  fiscalAddressIntNumber?: string | null;
  fiscalAddressNeighborhood?: string | null;
  fiscalAddressCity: string;
  fiscalAddressState: string;
  fiscalAddressZip: string;
}

export interface StudentGuardianLink {
  guardian: Guardian;
  relationship: string;
  isPrimary: boolean;
}

export interface Student {
  id: number;
  firstName: string;
  lastName1: string;
  lastName2?: string | null;
  dateOfBirth: string;
  groupId?: number | null;
  schoolCycleId: number;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'withdrawn';
  /** Prisma Decimal — arrives as string from API, use Number() for comparisons */
  totalDebt: string | number;
  notes?: string | null;
  group?: {
    id: number;
    name: string;
    level: string;
    grade?: string;
    section?: string;
  } | null;
  schoolCycle?: {
    id: number;
    name: string;
  };
  guardians?: StudentGuardianLink[];
}

export interface AcademicHistory {
  id: number;
  studentId: number;
  schoolCycleId: number;
  groupId: number;
  status: 'enrolled' | 'promoted' | 'withdrawn' | 'repeated';
  notes?: string | null;
  createdAt: string;
  schoolCycle?: {
    name: string;
  };
  group?: {
    name: string;
    level: string;
    grade: string;
    section: string;
  };
}

export interface StudentFormData {
  firstName: string;
  lastName1: string;
  lastName2?: string | null;
  dateOfBirth: string;
  groupId?: number | null;
  schoolCycleId: number;
  enrollmentDate: string;
  notes?: string | null;
  guardians: GuardianFormData[];
}

/** Fields accepted by PUT /api/students/:id — no guardians */
export interface UpdateStudentData {
  firstName?: string;
  lastName1?: string;
  lastName2?: string | null;
  dateOfBirth?: string;
  groupId?: number | null;
  schoolCycleId?: number;
  enrollmentDate?: string;
  status?: 'active' | 'inactive' | 'withdrawn';
  notes?: string | null;
}

export interface GuardianFormData {
  id?: number;
  firstName: string;
  lastName1: string;
  lastName2?: string | null;
  email?: string | null;
  phone: string;
  phoneSecondary?: string | null;
  address?: string | null;
  relationship: string;
  isPrimary: boolean;
  fiscalData?: FiscalDataFormData | null;
}

/** Fields accepted by POST/PUT /api/guardians — no relationship/isPrimary/fiscalData */
export interface GuardianData {
  firstName: string;
  lastName1: string;
  lastName2?: string | null;
  email?: string | null;
  phone: string;
  phoneSecondary?: string | null;
  address?: string | null;
}

export interface FiscalDataFormData {
  rfc: string;
  businessName: string;
  cfdiUsage: string;
  fiscalRegime?: string | null;
  fiscalAddressStreet: string;
  fiscalAddressExtNumber?: string | null;
  fiscalAddressIntNumber?: string | null;
  fiscalAddressNeighborhood?: string | null;
  fiscalAddressCity: string;
  fiscalAddressState: string;
  fiscalAddressZip: string;
}
