import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Collapse,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Add,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useStudentById, useStudentAcademicHistory, useUpdateStudent, useAddGuardianToStudent } from '@/hooks/useStudents';
import { useGuardians, useUpdateGuardian, useUpsertFiscalData, useUpdateGuardianLink } from '@/hooks/useGuardians';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import { useGroups } from '@/hooks/useGroups';
import type {
  StudentGuardianLink,
  UpdateStudentData,
  GuardianData,
  GuardianFormData,
  FiscalDataFormData,
  Guardian,
} from '@/types/student';

const LEVEL_LABELS: Record<string, string> = {
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  prepa: 'Preparatoria',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  withdrawn: 'Baja',
};

const STATUS_COLORS: Record<string, 'success' | 'default' | 'error'> = {
  active: 'success',
  inactive: 'default',
  withdrawn: 'error',
};

const HISTORY_STATUS_LABELS: Record<string, string> = {
  enrolled: 'Inscrito',
  promoted: 'Promovido',
  withdrawn: 'Baja',
  repeated: 'Repitió',
};

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const studentId = Number(id);

  const [tabIndex, setTabIndex] = useState(0);

  // Data queries
  const { data: studentResponse, isLoading } = useStudentById(studentId);
  const { data: historyResponse } = useStudentAcademicHistory(studentId);
  const student = studentResponse?.data;
  const academicHistory = historyResponse?.data ?? [];

  // Edit student dialog state
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState<UpdateStudentData>({});
  const [editStudentError, setEditStudentError] = useState('');
  const updateStudentMutation = useUpdateStudent();

  // Edit guardian dialog state
  const [editGuardianOpen, setEditGuardianOpen] = useState(false);
  const [editingGuardianLink, setEditingGuardianLink] = useState<StudentGuardianLink | null>(null);
  const [editGuardianData, setEditGuardianData] = useState<GuardianData>({
    firstName: '',
    lastName1: '',
    lastName2: null,
    email: null,
    phone: '',
    phoneSecondary: null,
    address: null,
  });
  const [editGuardianError, setEditGuardianError] = useState('');
  const [editLinkData, setEditLinkData] = useState<{ relationship: string; isPrimary: boolean }>({
    relationship: '',
    isPrimary: false,
  });
  const updateGuardianMutation = useUpdateGuardian();
  const updateLinkMutation = useUpdateGuardianLink();

  // Edit fiscal data dialog state
  const [editFiscalOpen, setEditFiscalOpen] = useState(false);
  const [editFiscalGuardianId, setEditFiscalGuardianId] = useState<number>(0);
  const [editFiscalData, setEditFiscalData] = useState<FiscalDataFormData>({
    rfc: '',
    businessName: '',
    cfdiUsage: '',
    fiscalRegime: null,
    fiscalAddressStreet: '',
    fiscalAddressExtNumber: null,
    fiscalAddressIntNumber: null,
    fiscalAddressNeighborhood: null,
    fiscalAddressCity: '',
    fiscalAddressState: '',
    fiscalAddressZip: '',
  });
  const [editFiscalError, setEditFiscalError] = useState('');
  const upsertFiscalMutation = useUpsertFiscalData();

  // Add guardian dialog state
  const [addGuardianOpen, setAddGuardianOpen] = useState(false);
  const [addGuardianMode, setAddGuardianMode] = useState<'new' | 'link'>('new');
  const [addGuardianData, setAddGuardianData] = useState<Omit<GuardianFormData, 'fiscalData'>>({
    firstName: '',
    lastName1: '',
    lastName2: null,
    email: null,
    phone: '',
    phoneSecondary: null,
    address: null,
    relationship: 'Madre',
    isPrimary: false,
  });
  const [addGuardianError, setAddGuardianError] = useState('');
  const [guardianSearch, setGuardianSearch] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const addGuardianMutation = useAddGuardianToStudent();
  const { data: guardianSearchResponse } = useGuardians(1, 10, guardianSearch || undefined);
  const guardianSearchResults = guardianSearchResponse?.data ?? [];

  // Fiscal data collapse per guardian
  const [expandedFiscal, setExpandedFiscal] = useState<Record<number, boolean>>({});

  // Dropdowns for edit student dialog
  const { data: cyclesResponse } = useSchoolCycles(1, 100);
  const cycles = cyclesResponse?.data ?? [];
  const editCycleId = editStudentData.schoolCycleId ?? student?.schoolCycle?.id;
  const { data: groupsResponse } = useGroups(1, 100, editCycleId, 'promotionOrder', 'asc');
  const groups = groupsResponse?.data ?? [];

  // --- Edit student handlers ---
  const openEditStudent = () => {
    if (!student) return;
    setEditStudentData({
      firstName: student.firstName,
      lastName1: student.lastName1,
      lastName2: student.lastName2 ?? null,
      dateOfBirth: student.dateOfBirth.split('T')[0],
      groupId: student.groupId ?? null,
      schoolCycleId: student.schoolCycleId,
      enrollmentDate: student.enrollmentDate.split('T')[0],
      status: student.status,
      notes: student.notes ?? null,
    });
    setEditStudentError('');
    setEditStudentOpen(true);
  };

  const handleSaveStudent = async () => {
    if (!editStudentData.firstName?.trim()) {
      setEditStudentError('El nombre es requerido');
      return;
    }
    if (!editStudentData.lastName1?.trim()) {
      setEditStudentError('El apellido paterno es requerido');
      return;
    }
    try {
      await updateStudentMutation.mutateAsync({ id: studentId, data: editStudentData });
      enqueueSnackbar('Alumno actualizado', { variant: 'success' });
      setEditStudentOpen(false);
    } catch {
      setEditStudentError('Error al actualizar el alumno');
    }
  };

  // --- Edit guardian handlers ---
  const openEditGuardian = (link: StudentGuardianLink) => {
    setEditingGuardianLink(link);
    const g = link.guardian;
    setEditGuardianData({
      firstName: g.firstName,
      lastName1: g.lastName1,
      lastName2: g.lastName2 ?? null,
      email: g.email ?? null,
      phone: g.phone,
      phoneSecondary: g.phoneSecondary ?? null,
      address: g.address ?? null,
    });
    setEditLinkData({
      relationship: link.relationship,
      isPrimary: link.isPrimary,
    });
    setEditGuardianError('');
    setEditGuardianOpen(true);
  };

  const handleSaveGuardian = async () => {
    if (!editGuardianData.firstName.trim()) {
      setEditGuardianError('El nombre es requerido');
      return;
    }
    if (!editGuardianData.lastName1.trim()) {
      setEditGuardianError('El apellido paterno es requerido');
      return;
    }
    if (!editGuardianData.phone.trim()) {
      setEditGuardianError('El teléfono es requerido');
      return;
    }
    if (!editingGuardianLink) return;
    try {
      await updateGuardianMutation.mutateAsync({
        id: editingGuardianLink.guardian.id,
        data: editGuardianData,
      });

      // Update link data if relationship or isPrimary changed
      const linkChanged =
        editLinkData.relationship !== editingGuardianLink.relationship ||
        editLinkData.isPrimary !== editingGuardianLink.isPrimary;
      if (linkChanged) {
        await updateLinkMutation.mutateAsync({
          guardianId: editingGuardianLink.guardian.id,
          studentId,
          data: editLinkData,
        });
      }

      enqueueSnackbar('Tutor actualizado', { variant: 'success' });
      setEditGuardianOpen(false);
    } catch {
      setEditGuardianError('Error al actualizar el tutor');
    }
  };

  // --- Fiscal data handlers ---
  const openEditFiscal = (guardianId: number, existing: StudentGuardianLink['guardian']['fiscalData']) => {
    setEditFiscalGuardianId(guardianId);
    if (existing) {
      setEditFiscalData({
        rfc: existing.rfc,
        businessName: existing.businessName,
        cfdiUsage: existing.cfdiUsage,
        fiscalRegime: existing.fiscalRegime ?? null,
        fiscalAddressStreet: existing.fiscalAddressStreet,
        fiscalAddressExtNumber: existing.fiscalAddressExtNumber ?? null,
        fiscalAddressIntNumber: existing.fiscalAddressIntNumber ?? null,
        fiscalAddressNeighborhood: existing.fiscalAddressNeighborhood ?? null,
        fiscalAddressCity: existing.fiscalAddressCity,
        fiscalAddressState: existing.fiscalAddressState,
        fiscalAddressZip: existing.fiscalAddressZip,
      });
    } else {
      setEditFiscalData({
        rfc: '',
        businessName: '',
        cfdiUsage: '',
        fiscalRegime: null,
        fiscalAddressStreet: '',
        fiscalAddressExtNumber: null,
        fiscalAddressIntNumber: null,
        fiscalAddressNeighborhood: null,
        fiscalAddressCity: '',
        fiscalAddressState: '',
        fiscalAddressZip: '',
      });
    }
    setEditFiscalError('');
    setEditFiscalOpen(true);
  };

  const handleSaveFiscal = async () => {
    if (!editFiscalData.rfc.trim()) {
      setEditFiscalError('El RFC es requerido');
      return;
    }
    if (!editFiscalData.businessName.trim()) {
      setEditFiscalError('La razón social es requerida');
      return;
    }
    try {
      await upsertFiscalMutation.mutateAsync({
        guardianId: editFiscalGuardianId,
        data: editFiscalData,
      });
      enqueueSnackbar('Datos fiscales actualizados', { variant: 'success' });
      setEditFiscalOpen(false);
    } catch {
      setEditFiscalError('Error al actualizar datos fiscales');
    }
  };

  // --- Add guardian handlers ---
  const openAddGuardian = () => {
    setAddGuardianMode('new');
    setAddGuardianData({
      firstName: '',
      lastName1: '',
      lastName2: null,
      email: null,
      phone: '',
      phoneSecondary: null,
      address: null,
      relationship: 'Madre',
      isPrimary: false,
    });
    setSelectedGuardian(null);
    setGuardianSearch('');
    setAddGuardianError('');
    setAddGuardianOpen(true);
  };

  const handleSaveAddGuardian = async () => {
    if (addGuardianMode === 'link') {
      if (!selectedGuardian) {
        setAddGuardianError('Selecciona un tutor existente');
        return;
      }
      try {
        await addGuardianMutation.mutateAsync({
          studentId,
          data: {
            id: selectedGuardian.id,
            firstName: selectedGuardian.firstName,
            lastName1: selectedGuardian.lastName1,
            phone: selectedGuardian.phone,
            relationship: addGuardianData.relationship,
            isPrimary: addGuardianData.isPrimary,
          },
        });
        enqueueSnackbar('Tutor vinculado exitosamente', { variant: 'success' });
        setAddGuardianOpen(false);
      } catch (err: unknown) {
        const msg =
          err instanceof Error && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setAddGuardianError(msg ?? 'Error al vincular el tutor');
      }
    } else {
      if (!addGuardianData.firstName.trim()) {
        setAddGuardianError('El nombre es requerido');
        return;
      }
      if (!addGuardianData.lastName1.trim()) {
        setAddGuardianError('El apellido paterno es requerido');
        return;
      }
      if (!addGuardianData.phone.trim()) {
        setAddGuardianError('El teléfono es requerido');
        return;
      }
      try {
        await addGuardianMutation.mutateAsync({
          studentId,
          data: addGuardianData,
        });
        enqueueSnackbar('Tutor agregado exitosamente', { variant: 'success' });
        setAddGuardianOpen(false);
      } catch (err: unknown) {
        const msg =
          err instanceof Error && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setAddGuardianError(msg ?? 'Error al agregar el tutor');
      }
    }
  };

  // --- Render ---
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/alumnos')}>
          Volver
        </Button>
        <Alert severity="error" sx={{ mt: 2 }}>
          Alumno no encontrado
        </Alert>
      </Box>
    );
  }

  const fullName = [student.firstName, student.lastName1, student.lastName2]
    .filter(Boolean)
    .join(' ');
  const groupLabel = student.group
    ? `${LEVEL_LABELS[student.group.level] ?? student.group.level} ${student.group.name}`
    : 'Sin grupo';
  const debt = Number(student.totalDebt);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton onClick={() => navigate('/alumnos')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {fullName}
        </Typography>
        <IconButton onClick={openEditStudent} title="Editar alumno">
          <Edit />
        </IconButton>
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, ml: 6, flexWrap: 'wrap' }}>
        <Chip
          label={STATUS_LABELS[student.status] ?? student.status}
          color={STATUS_COLORS[student.status] ?? 'default'}
          size="small"
        />
        <Chip label={groupLabel} variant="outlined" size="small" />
        <Chip label={student.schoolCycle?.name} variant="outlined" size="small" />
        <Chip
          label={`Deuda: $${debt.toFixed(2)}`}
          color={debt > 0 ? 'error' : 'success'}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Tabs */}
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
        <Tab label="Información" />
        <Tab label="Pagos" />
        <Tab label="Uniformes" />
        <Tab label="Historial Académico" />
      </Tabs>

      {/* Tab: Info */}
      <TabPanel value={tabIndex} index={0}>
        {/* Personal data */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Datos Personales
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                gap: 2,
              }}
            >
              <InfoField label="Nombre(s)" value={student.firstName} />
              <InfoField label="Apellido Paterno" value={student.lastName1} />
              <InfoField label="Apellido Materno" value={student.lastName2 ?? '—'} />
              <InfoField
                label="Fecha de Nacimiento"
                value={new Date(student.dateOfBirth).toLocaleDateString('es-MX')}
              />
              <InfoField
                label="Fecha de Inscripción"
                value={new Date(student.enrollmentDate).toLocaleDateString('es-MX')}
              />
              <InfoField label="Anotaciones" value={student.notes ?? '—'} />
            </Box>
          </CardContent>
        </Card>

        {/* Guardians */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Tutores</Typography>
          <Button
            startIcon={<Add />}
            size="small"
            onClick={openAddGuardian}
            disabled={(student.guardians?.length ?? 0) >= 4}
          >
            Agregar Tutor
          </Button>
        </Box>
        {[...(student.guardians ?? [])].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)).map((link) => {
          const g = link.guardian;
          const gFullName = [g.firstName, g.lastName1, g.lastName2].filter(Boolean).join(' ');
          const isExpanded = expandedFiscal[g.id] ?? false;

          return (
            <Card key={g.id} sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {gFullName}
                    </Typography>
                    <Chip label={link.relationship} size="small" variant="outlined" />
                    {link.isPrimary && <Chip label="Principal" color="primary" size="small" />}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => openEditGuardian(link)}
                    title="Editar tutor"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <InfoField label="Teléfono" value={g.phone} />
                  <InfoField label="Teléfono Secundario" value={g.phoneSecondary ?? '—'} />
                  <InfoField label="Correo" value={g.email ?? '—'} />
                  <InfoField label="Dirección" value={g.address ?? '—'} />
                </Box>

                {/* Fiscal data */}
                <Divider sx={{ my: 2 }} />
                <Button
                  size="small"
                  onClick={() =>
                    setExpandedFiscal((prev) => ({ ...prev, [g.id]: !prev[g.id] }))
                  }
                  endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                >
                  Datos Fiscales
                </Button>

                <Collapse in={isExpanded}>
                  {g.fiscalData ? (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                          gap: 2,
                        }}
                      >
                        <InfoField label="RFC" value={g.fiscalData.rfc} />
                        <InfoField label="Razón Social" value={g.fiscalData.businessName} />
                        <InfoField label="Uso de CFDI" value={g.fiscalData.cfdiUsage} />
                        <InfoField label="Régimen Fiscal" value={g.fiscalData.fiscalRegime ?? '—'} />
                        <InfoField label="Calle" value={g.fiscalData.fiscalAddressStreet} />
                        <InfoField label="No. Exterior" value={g.fiscalData.fiscalAddressExtNumber ?? '—'} />
                        <InfoField label="No. Interior" value={g.fiscalData.fiscalAddressIntNumber ?? '—'} />
                        <InfoField label="Colonia" value={g.fiscalData.fiscalAddressNeighborhood ?? '—'} />
                        <InfoField label="Ciudad" value={g.fiscalData.fiscalAddressCity} />
                        <InfoField label="Estado" value={g.fiscalData.fiscalAddressState} />
                        <InfoField label="C.P." value={g.fiscalData.fiscalAddressZip} />
                      </Box>
                      <Button
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => openEditFiscal(g.id, g.fiscalData)}
                      >
                        Editar datos fiscales
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay datos fiscales registrados.
                      </Typography>
                      <Button
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => openEditFiscal(g.id, null)}
                      >
                        Agregar datos fiscales
                      </Button>
                    </Box>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </TabPanel>

      {/* Tab: Pagos */}
      <TabPanel value={tabIndex} index={1}>
        <Alert severity="info">Se habilitará en Step 9</Alert>
      </TabPanel>

      {/* Tab: Uniformes */}
      <TabPanel value={tabIndex} index={2}>
        <Alert severity="info">Se habilitará en Step 10</Alert>
      </TabPanel>

      {/* Tab: Academic History */}
      <TabPanel value={tabIndex} index={3}>
        <Card>
          <CardContent>
            {academicHistory.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No hay historial académico registrado
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ciclo Escolar</TableCell>
                      <TableCell>Grupo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Notas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {academicHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.schoolCycle?.name}</TableCell>
                        <TableCell>
                          {record.group
                            ? `${LEVEL_LABELS[record.group.level] ?? record.group.level} ${record.group.name}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={HISTORY_STATUS_LABELS[record.status] ?? record.status}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{record.notes ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Student Dialog */}
      <Dialog open={editStudentOpen} onClose={() => setEditStudentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Alumno</DialogTitle>
        <DialogContent>
          {editStudentError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {editStudentError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre(s)"
              placeholder="ej. Juan Carlos"
              value={editStudentData.firstName ?? ''}
              onChange={(e) =>
                setEditStudentData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Apellido Paterno"
              placeholder="ej. García"
              value={editStudentData.lastName1 ?? ''}
              onChange={(e) =>
                setEditStudentData((prev) => ({ ...prev, lastName1: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Apellido Materno"
              placeholder="ej. López"
              value={editStudentData.lastName2 ?? ''}
              onChange={(e) =>
                setEditStudentData((prev) => ({ ...prev, lastName2: e.target.value || null }))
              }
              fullWidth
            />
            <DatePicker
              label="Fecha de Nacimiento"
              value={editStudentData.dateOfBirth ? dayjs(editStudentData.dateOfBirth) : null}
              onChange={(value: Dayjs | null) =>
                setEditStudentData((prev) => ({
                  ...prev,
                  dateOfBirth: value?.format('YYYY-MM-DD') ?? '',
                }))
              }
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              select
              label="Ciclo Escolar"
              value={editStudentData.schoolCycleId ?? ''}
              onChange={(e) =>
                setEditStudentData((prev) => ({
                  ...prev,
                  schoolCycleId: Number(e.target.value),
                  groupId: null,
                }))
              }
              fullWidth
            >
              {cycles.map((cycle) => (
                <MenuItem key={cycle.id} value={cycle.id}>
                  {cycle.name} {cycle.isActive ? '(Activo)' : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Grupo"
              value={editStudentData.groupId ?? ''}
              onChange={(e) =>
                setEditStudentData((prev) => ({
                  ...prev,
                  groupId: e.target.value ? Number(e.target.value) : null,
                }))
              }
              fullWidth
            >
              <MenuItem value="">Sin grupo</MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {LEVEL_LABELS[group.level] ?? group.level} {group.name}
                </MenuItem>
              ))}
            </TextField>
            <DatePicker
              label="Fecha de Inscripción"
              value={editStudentData.enrollmentDate ? dayjs(editStudentData.enrollmentDate) : null}
              onChange={(value: Dayjs | null) =>
                setEditStudentData((prev) => ({
                  ...prev,
                  enrollmentDate: value?.format('YYYY-MM-DD') ?? '',
                }))
              }
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              select
              label="Estado"
              value={editStudentData.status ?? ''}
              onChange={(e) =>
                setEditStudentData((prev) => ({
                  ...prev,
                  status: e.target.value as 'active' | 'inactive' | 'withdrawn',
                }))
              }
              fullWidth
            >
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
              <MenuItem value="withdrawn">Baja</MenuItem>
            </TextField>
          </Box>
          <TextField
            label="Anotaciones"
            placeholder="ej. Alumno con beca parcial"
            value={editStudentData.notes ?? ''}
            onChange={(e) =>
              setEditStudentData((prev) => ({ ...prev, notes: e.target.value || null }))
            }
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStudentOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveStudent}
            disabled={updateStudentMutation.isPending}
          >
            {updateStudentMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Guardian Dialog */}
      <Dialog open={editGuardianOpen} onClose={() => setEditGuardianOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Tutor</DialogTitle>
        <DialogContent>
          {editGuardianError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {editGuardianError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre(s)"
              placeholder="ej. María"
              value={editGuardianData.firstName}
              onChange={(e) =>
                setEditGuardianData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Apellido Paterno"
              placeholder="ej. García"
              value={editGuardianData.lastName1}
              onChange={(e) =>
                setEditGuardianData((prev) => ({ ...prev, lastName1: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Apellido Materno"
              placeholder="ej. López"
              value={editGuardianData.lastName2 ?? ''}
              onChange={(e) =>
                setEditGuardianData((prev) => ({
                  ...prev,
                  lastName2: e.target.value || null,
                }))
              }
              fullWidth
            />
            <TextField
              label="Teléfono"
              placeholder="ej. 6141234567"
              value={editGuardianData.phone}
              onChange={(e) =>
                setEditGuardianData((prev) => ({ ...prev, phone: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Teléfono Secundario"
              placeholder="ej. 6149876543"
              value={editGuardianData.phoneSecondary ?? ''}
              onChange={(e) =>
                setEditGuardianData((prev) => ({
                  ...prev,
                  phoneSecondary: e.target.value || null,
                }))
              }
              fullWidth
            />
            <TextField
              label="Correo Electrónico"
              placeholder="ej. maria@gmail.com"
              value={editGuardianData.email ?? ''}
              onChange={(e) =>
                setEditGuardianData((prev) => ({ ...prev, email: e.target.value || null }))
              }
              fullWidth
            />
            <TextField
              label="Dirección"
              placeholder="ej. Calle Reforma #123, Col. Centro"
              value={editGuardianData.address ?? ''}
              onChange={(e) =>
                setEditGuardianData((prev) => ({ ...prev, address: e.target.value || null }))
              }
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Relación"
              value={editLinkData.relationship}
              onChange={(e) =>
                setEditLinkData((prev) => ({ ...prev, relationship: e.target.value }))
              }
              fullWidth
            >
              <MenuItem value="Madre">Madre</MenuItem>
              <MenuItem value="Padre">Padre</MenuItem>
              <MenuItem value="Tutor">Tutor</MenuItem>
              <MenuItem value="Abuelo/a">Abuelo/a</MenuItem>
              <MenuItem value="Tío/a">Tío/a</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editLinkData.isPrimary}
                  onChange={(e) =>
                    setEditLinkData((prev) => ({ ...prev, isPrimary: e.target.checked }))
                  }
                />
              }
              label="Tutor Principal"
              sx={{ alignSelf: 'center' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGuardianOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveGuardian}
            disabled={updateGuardianMutation.isPending || updateLinkMutation.isPending}
          >
            {updateGuardianMutation.isPending || updateLinkMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Fiscal Data Dialog */}
      <Dialog open={editFiscalOpen} onClose={() => setEditFiscalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Datos Fiscales</DialogTitle>
        <DialogContent>
          {editFiscalError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {editFiscalError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="RFC"
              placeholder="ej. GALO850101AB1"
              value={editFiscalData.rfc}
              onChange={(e) =>
                setEditFiscalData((prev) => ({ ...prev, rfc: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Razón Social"
              placeholder="ej. María García López"
              value={editFiscalData.businessName}
              onChange={(e) =>
                setEditFiscalData((prev) => ({ ...prev, businessName: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Uso de CFDI"
              placeholder="ej. D10 Pagos por servicios educativos"
              value={editFiscalData.cfdiUsage}
              onChange={(e) =>
                setEditFiscalData((prev) => ({ ...prev, cfdiUsage: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Régimen Fiscal"
              placeholder="ej. 612 Personas Físicas"
              value={editFiscalData.fiscalRegime ?? ''}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalRegime: e.target.value || null,
                }))
              }
              fullWidth
            />
            <TextField
              label="Calle"
              placeholder="ej. Av. Reforma"
              value={editFiscalData.fiscalAddressStreet}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalAddressStreet: e.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="No. Exterior"
              placeholder="ej. 123"
              value={editFiscalData.fiscalAddressExtNumber ?? ''}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalAddressExtNumber: e.target.value || null,
                }))
              }
              fullWidth
            />
            <TextField
              label="No. Interior"
              placeholder="ej. A"
              value={editFiscalData.fiscalAddressIntNumber ?? ''}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalAddressIntNumber: e.target.value || null,
                }))
              }
              fullWidth
            />
            <TextField
              label="Colonia"
              placeholder="ej. Centro"
              value={editFiscalData.fiscalAddressNeighborhood ?? ''}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalAddressNeighborhood: e.target.value || null,
                }))
              }
              fullWidth
            />
            <TextField
              label="Ciudad"
              placeholder="ej. Chihuahua"
              value={editFiscalData.fiscalAddressCity}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalAddressCity: e.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Estado"
              placeholder="ej. Chihuahua"
              value={editFiscalData.fiscalAddressState}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalAddressState: e.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label="Código Postal"
              placeholder="ej. 31000"
              value={editFiscalData.fiscalAddressZip}
              onChange={(e) =>
                setEditFiscalData((prev) => ({
                  ...prev,
                  fiscalAddressZip: e.target.value,
                }))
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFiscalOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveFiscal}
            disabled={upsertFiscalMutation.isPending}
          >
            {upsertFiscalMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Guardian Dialog */}
      <Dialog open={addGuardianOpen} onClose={() => setAddGuardianOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Tutor</DialogTitle>
        <DialogContent>
          {addGuardianError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {addGuardianError}
            </Alert>
          )}

          {/* Mode toggle */}
          <Tabs
            value={addGuardianMode === 'new' ? 0 : 1}
            onChange={(_, v) => {
              setAddGuardianMode(v === 0 ? 'new' : 'link');
              setAddGuardianError('');
            }}
            sx={{ mb: 2 }}
          >
            <Tab label="Nuevo" />
            <Tab label="Vincular Existente" />
          </Tabs>

          {addGuardianMode === 'new' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Nombre(s)"
                placeholder="ej. María"
                value={addGuardianData.firstName}
                onChange={(e) =>
                  setAddGuardianData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Apellido Paterno"
                placeholder="ej. García"
                value={addGuardianData.lastName1}
                onChange={(e) =>
                  setAddGuardianData((prev) => ({ ...prev, lastName1: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Apellido Materno"
                placeholder="ej. López"
                value={addGuardianData.lastName2 ?? ''}
                onChange={(e) =>
                  setAddGuardianData((prev) => ({
                    ...prev,
                    lastName2: e.target.value || null,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Teléfono"
                placeholder="ej. 6141234567"
                value={addGuardianData.phone}
                onChange={(e) =>
                  setAddGuardianData((prev) => ({ ...prev, phone: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Teléfono Secundario"
                placeholder="ej. 6149876543"
                value={addGuardianData.phoneSecondary ?? ''}
                onChange={(e) =>
                  setAddGuardianData((prev) => ({
                    ...prev,
                    phoneSecondary: e.target.value || null,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Correo Electrónico"
                placeholder="ej. maria@gmail.com"
                value={addGuardianData.email ?? ''}
                onChange={(e) =>
                  setAddGuardianData((prev) => ({ ...prev, email: e.target.value || null }))
                }
                fullWidth
              />
              <TextField
                label="Dirección"
                placeholder="ej. Calle Reforma #123, Col. Centro"
                value={addGuardianData.address ?? ''}
                onChange={(e) =>
                  setAddGuardianData((prev) => ({ ...prev, address: e.target.value || null }))
                }
                fullWidth
                sx={{ gridColumn: 'span 2' }}
              />
            </Box>
          ) : (
            <Autocomplete
              options={guardianSearchResults}
              getOptionLabel={(option) =>
                [option.firstName, option.lastName1, option.lastName2].filter(Boolean).join(' ')
              }
              value={selectedGuardian}
              onChange={(_, value) => setSelectedGuardian(value)}
              onInputChange={(_, value) => setGuardianSearch(value)}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">
                      {[option.firstName, option.lastName1, option.lastName2].filter(Boolean).join(' ')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.phone} {option.email ? `· ${option.email}` : ''}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar tutor existente"
                  placeholder="ej. García"
                  fullWidth
                />
              )}
              noOptionsText="No se encontraron tutores"
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          )}

          {/* Relationship & isPrimary — shared by both modes */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Relación"
              value={addGuardianData.relationship}
              onChange={(e) =>
                setAddGuardianData((prev) => ({ ...prev, relationship: e.target.value }))
              }
              fullWidth
            >
              <MenuItem value="Madre">Madre</MenuItem>
              <MenuItem value="Padre">Padre</MenuItem>
              <MenuItem value="Tutor">Tutor</MenuItem>
              <MenuItem value="Abuelo/a">Abuelo/a</MenuItem>
              <MenuItem value="Tío/a">Tío/a</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={addGuardianData.isPrimary}
                  onChange={(e) =>
                    setAddGuardianData((prev) => ({ ...prev, isPrimary: e.target.checked }))
                  }
                />
              }
              label="Tutor Principal"
              sx={{ alignSelf: 'center' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddGuardianOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveAddGuardian}
            disabled={addGuardianMutation.isPending}
          >
            {addGuardianMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/** Read-only field display */
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
