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
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import { ArrowBack, Edit, LinkOff, Visibility } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useGuardianById,
  useUpdateGuardian,
  useUpsertFiscalData,
  useUnlinkStudent,
} from '@/hooks/useGuardians';
import type { GuardianData, FiscalDataFormData } from '@/types/student';

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

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

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

export default function GuardianDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const guardianId = Number(id);

  const [tabIndex, setTabIndex] = useState(0);

  const { data: guardianResponse, isLoading } = useGuardianById(guardianId);
  const guardian = guardianResponse?.data;

  // Computed active status
  const isActive = guardian?.students?.some((link) => link.student.status === 'active');

  // Edit guardian dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<GuardianData>({
    firstName: '',
    lastName1: '',
    lastName2: null,
    email: null,
    phone: '',
    phoneSecondary: null,
    address: null,
  });
  const [editError, setEditError] = useState('');
  const updateGuardianMutation = useUpdateGuardian();

  // Edit fiscal data dialog state
  const [editFiscalOpen, setEditFiscalOpen] = useState(false);
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

  // Unlink confirmation
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ studentId: number; studentName: string } | null>(null);
  const unlinkMutation = useUnlinkStudent();

  // --- Edit guardian handlers ---
  const openEdit = () => {
    if (!guardian) return;
    setEditData({
      firstName: guardian.firstName,
      lastName1: guardian.lastName1,
      lastName2: guardian.lastName2 ?? null,
      email: guardian.email ?? null,
      phone: guardian.phone,
      phoneSecondary: guardian.phoneSecondary ?? null,
      address: guardian.address ?? null,
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editData.firstName.trim()) {
      setEditError('El nombre es requerido');
      return;
    }
    if (!editData.lastName1.trim()) {
      setEditError('El apellido paterno es requerido');
      return;
    }
    if (!editData.phone.trim()) {
      setEditError('El teléfono es requerido');
      return;
    }
    try {
      await updateGuardianMutation.mutateAsync({ id: guardianId, data: editData });
      enqueueSnackbar('Tutor actualizado', { variant: 'success' });
      setEditOpen(false);
    } catch {
      setEditError('Error al actualizar el tutor');
    }
  };

  // --- Edit fiscal data handlers ---
  const openEditFiscal = () => {
    if (!guardian) return;
    const existing = guardian.fiscalData;
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
      await upsertFiscalMutation.mutateAsync({ guardianId, data: editFiscalData });
      enqueueSnackbar('Datos fiscales actualizados', { variant: 'success' });
      setEditFiscalOpen(false);
    } catch {
      setEditFiscalError('Error al actualizar datos fiscales');
    }
  };

  // --- Unlink handler ---
  const handleUnlink = async () => {
    if (!unlinkConfirm) return;
    try {
      await unlinkMutation.mutateAsync({ guardianId, studentId: unlinkConfirm.studentId });
      enqueueSnackbar('Alumno desvinculado', { variant: 'success' });
      setUnlinkConfirm(null);
    } catch {
      enqueueSnackbar('Error al desvincular alumno', { variant: 'error' });
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

  if (!guardian) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/tutores')}>
          Volver
        </Button>
        <Alert severity="error" sx={{ mt: 2 }}>
          Tutor no encontrado
        </Alert>
      </Box>
    );
  }

  const fullName = [guardian.firstName, guardian.lastName1, guardian.lastName2]
    .filter(Boolean)
    .join(' ');
  const studentCount = guardian.students?.length ?? 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton onClick={() => navigate('/tutores')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {fullName}
        </Typography>
        <IconButton onClick={openEdit} title="Editar tutor">
          <Edit />
        </IconButton>
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, ml: 6, flexWrap: 'wrap' }}>
        <Chip
          label={isActive ? 'Activo' : 'Inactivo'}
          color={isActive ? 'success' : 'default'}
          size="small"
        />
        <Chip label={`${studentCount} alumno${studentCount !== 1 ? 's' : ''}`} variant="outlined" size="small" />
      </Box>

      {/* Tabs */}
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
        <Tab label="Información" />
        <Tab label="Datos Fiscales" />
        <Tab label="Alumnos Vinculados" />
      </Tabs>

      {/* Tab: Info */}
      <TabPanel value={tabIndex} index={0}>
        <Card>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                gap: 2,
              }}
            >
              <InfoField label="Nombre(s)" value={guardian.firstName} />
              <InfoField label="Apellido Paterno" value={guardian.lastName1} />
              <InfoField label="Apellido Materno" value={guardian.lastName2 ?? '—'} />
              <InfoField label="Teléfono" value={guardian.phone} />
              <InfoField label="Teléfono Secundario" value={guardian.phoneSecondary ?? '—'} />
              <InfoField label="Correo Electrónico" value={guardian.email ?? '—'} />
              <InfoField label="Dirección" value={guardian.address ?? '—'} />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab: Datos Fiscales */}
      <TabPanel value={tabIndex} index={1}>
        <Card>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            {guardian.fiscalData ? (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <InfoField label="RFC" value={guardian.fiscalData.rfc} />
                  <InfoField label="Razón Social" value={guardian.fiscalData.businessName} />
                  <InfoField label="Uso de CFDI" value={guardian.fiscalData.cfdiUsage} />
                  <InfoField label="Régimen Fiscal" value={guardian.fiscalData.fiscalRegime ?? '—'} />
                  <InfoField label="Calle" value={guardian.fiscalData.fiscalAddressStreet} />
                  <InfoField label="No. Exterior" value={guardian.fiscalData.fiscalAddressExtNumber ?? '—'} />
                  <InfoField label="No. Interior" value={guardian.fiscalData.fiscalAddressIntNumber ?? '—'} />
                  <InfoField label="Colonia" value={guardian.fiscalData.fiscalAddressNeighborhood ?? '—'} />
                  <InfoField label="Ciudad" value={guardian.fiscalData.fiscalAddressCity} />
                  <InfoField label="Estado" value={guardian.fiscalData.fiscalAddressState} />
                  <InfoField label="C.P." value={guardian.fiscalData.fiscalAddressZip} />
                </Box>
                <Button size="small" sx={{ mt: 2 }} onClick={openEditFiscal}>
                  Editar datos fiscales
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  No hay datos fiscales registrados.
                </Typography>
                <Button size="small" sx={{ mt: 1 }} onClick={openEditFiscal}>
                  Agregar datos fiscales
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab: Alumnos Vinculados */}
      <TabPanel value={tabIndex} index={2}>
        <Card>
          <CardContent>
            {studentCount === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No hay alumnos vinculados
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Grupo</TableCell>
                      <TableCell>Relación</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {guardian.students?.map((link) => {
                      const s = link.student;
                      const studentName = [s.firstName, s.lastName1, s.lastName2].filter(Boolean).join(' ');
                      const groupLabel = s.group
                        ? `${LEVEL_LABELS[s.group.level] ?? s.group.level} ${s.group.name}`
                        : 'Sin grupo';
                      const studentGuardianCount = s._count?.guardians ?? 1;
                      const canUnlink = studentGuardianCount > 1;

                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {studentName}
                              {link.isPrimary && <Chip label="Principal" color="primary" size="small" />}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[s.status] ?? s.status}
                              color={STATUS_COLORS[s.status] ?? 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{groupLabel}</TableCell>
                          <TableCell>{link.relationship}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Ver alumno">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/alumnos/${s.id}`)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={canUnlink ? 'Desvincular' : 'No se puede desvincular el único tutor'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    disabled={!canUnlink}
                                    onClick={() => setUnlinkConfirm({ studentId: s.id, studentName })}
                                  >
                                    <LinkOff fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Guardian Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Tutor</DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {editError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre(s)"
              placeholder="ej. María"
              value={editData.firstName}
              onChange={(e) => setEditData((prev) => ({ ...prev, firstName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Apellido Paterno"
              placeholder="ej. García"
              value={editData.lastName1}
              onChange={(e) => setEditData((prev) => ({ ...prev, lastName1: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Apellido Materno"
              placeholder="ej. López"
              value={editData.lastName2 ?? ''}
              onChange={(e) => setEditData((prev) => ({ ...prev, lastName2: e.target.value || null }))}
              fullWidth
            />
            <TextField
              label="Teléfono"
              placeholder="ej. 6141234567"
              value={editData.phone}
              onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Teléfono Secundario"
              placeholder="ej. 6149876543"
              value={editData.phoneSecondary ?? ''}
              onChange={(e) => setEditData((prev) => ({ ...prev, phoneSecondary: e.target.value || null }))}
              fullWidth
            />
            <TextField
              label="Correo Electrónico"
              placeholder="ej. maria@gmail.com"
              value={editData.email ?? ''}
              onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value || null }))}
              fullWidth
            />
            <TextField
              label="Dirección"
              placeholder="ej. Calle Reforma #123, Col. Centro"
              value={editData.address ?? ''}
              onChange={(e) => setEditData((prev) => ({ ...prev, address: e.target.value || null }))}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateGuardianMutation.isPending}
          >
            {updateGuardianMutation.isPending ? 'Guardando...' : 'Guardar'}
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
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, rfc: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Razón Social"
              placeholder="ej. María García López"
              value={editFiscalData.businessName}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, businessName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Uso de CFDI"
              placeholder="ej. D10 Pagos por servicios educativos"
              value={editFiscalData.cfdiUsage}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, cfdiUsage: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Régimen Fiscal"
              placeholder="ej. 612 Personas Físicas"
              value={editFiscalData.fiscalRegime ?? ''}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalRegime: e.target.value || null }))}
              fullWidth
            />
            <TextField
              label="Calle"
              placeholder="ej. Av. Reforma"
              value={editFiscalData.fiscalAddressStreet}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalAddressStreet: e.target.value }))}
              fullWidth
            />
            <TextField
              label="No. Exterior"
              placeholder="ej. 123"
              value={editFiscalData.fiscalAddressExtNumber ?? ''}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalAddressExtNumber: e.target.value || null }))}
              fullWidth
            />
            <TextField
              label="No. Interior"
              placeholder="ej. A"
              value={editFiscalData.fiscalAddressIntNumber ?? ''}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalAddressIntNumber: e.target.value || null }))}
              fullWidth
            />
            <TextField
              label="Colonia"
              placeholder="ej. Centro"
              value={editFiscalData.fiscalAddressNeighborhood ?? ''}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalAddressNeighborhood: e.target.value || null }))}
              fullWidth
            />
            <TextField
              label="Ciudad"
              placeholder="ej. Chihuahua"
              value={editFiscalData.fiscalAddressCity}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalAddressCity: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Estado"
              placeholder="ej. Chihuahua"
              value={editFiscalData.fiscalAddressState}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalAddressState: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Código Postal"
              placeholder="ej. 31000"
              value={editFiscalData.fiscalAddressZip}
              onChange={(e) => setEditFiscalData((prev) => ({ ...prev, fiscalAddressZip: e.target.value }))}
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

      {/* Unlink Confirmation Dialog */}
      <Dialog open={!!unlinkConfirm} onClose={() => setUnlinkConfirm(null)}>
        <DialogTitle>Desvincular Alumno</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de desvincular a <strong>{unlinkConfirm?.studentName}</strong> de este tutor?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlinkConfirm(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleUnlink}
            disabled={unlinkMutation.isPending}
          >
            {unlinkMutation.isPending ? 'Desvinculando...' : 'Desvincular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
