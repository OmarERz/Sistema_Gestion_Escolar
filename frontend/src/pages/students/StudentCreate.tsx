import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Divider,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Delete,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import { useGroups } from '@/hooks/useGroups';
import { useCreateStudent } from '@/hooks/useStudents';
import { useCheckDuplicateGuardian } from '@/hooks/useGuardians';
import type { StudentFormData, GuardianFormData, FiscalDataFormData } from '@/types/student';

const LEVEL_LABELS: Record<string, string> = {
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  prepa: 'Preparatoria',
};

const RELATIONSHIP_OPTIONS = [
  'Padre',
  'Madre',
  'Abuelo/a',
  'Tío/a',
  'Hermano/a',
  'Otro',
];

const EMPTY_FISCAL_DATA: FiscalDataFormData = {
  rfc: '',
  businessName: '',
  cfdiUsage: '',
  fiscalRegime: '',
  fiscalAddressStreet: '',
  fiscalAddressExtNumber: '',
  fiscalAddressIntNumber: '',
  fiscalAddressNeighborhood: '',
  fiscalAddressCity: '',
  fiscalAddressState: '',
  fiscalAddressZip: '',
};

function createEmptyGuardian(isPrimary: boolean): GuardianFormData {
  return {
    firstName: '',
    lastName1: '',
    lastName2: '',
    email: '',
    phone: '',
    phoneSecondary: '',
    address: '',
    relationship: '',
    isPrimary,
    fiscalData: null,
  };
}

/** Sub-component for guardian duplicate check */
function GuardianDuplicateAlert({
  phone,
  phoneSecondary,
  email,
}: {
  phone: string;
  phoneSecondary: string;
  email: string;
}) {
  const { data } = useCheckDuplicateGuardian(
    phone || undefined,
    phoneSecondary || undefined,
    email || undefined,
  );

  if (!data?.exists) return null;

  return (
    <Alert severity="warning" sx={{ mt: 1 }}>
      Se encontraron tutores similares:{' '}
      {data.guardians.map((g) => (
        <Chip
          key={g.id}
          label={`${g.firstName} ${g.lastName1} (${g.phone})`}
          size="small"
          sx={{ mr: 0.5 }}
        />
      ))}
    </Alert>
  );
}

export default function StudentCreate() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateStudent();

  // Student fields
  const [firstName, setFirstName] = useState('');
  const [lastName1, setLastName1] = useState('');
  const [lastName2, setLastName2] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [schoolCycleId, setSchoolCycleId] = useState<number | ''>('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [notes, setNotes] = useState('');

  // Guardians
  const [guardians, setGuardians] = useState<GuardianFormData[]>([createEmptyGuardian(true)]);
  const [expandedFiscal, setExpandedFiscal] = useState<Record<number, boolean>>({});

  // Duplicate check triggers (debounced values per guardian)
  const [dupCheckValues, setDupCheckValues] = useState<
    Record<number, { phone: string; phoneSecondary: string; email: string }>
  >({});

  // Form error
  const [formError, setFormError] = useState('');

  // Data for dropdowns
  const { data: cyclesResponse } = useSchoolCycles(1, 100);
  const cycles = cyclesResponse?.data ?? [];

  // Auto-select active cycle
  useEffect(() => {
    if (schoolCycleId === '' && cycles.length > 0) {
      const active = cycles.find((c) => c.isActive);
      setSchoolCycleId(active?.id ?? cycles[0].id);
    }
  }, [cycles, schoolCycleId]);

  const selectedCycleId = schoolCycleId === '' ? undefined : schoolCycleId;
  const { data: groupsResponse } = useGroups(1, 100, selectedCycleId, 'promotionOrder', 'asc');
  const groups = groupsResponse?.data ?? [];

  // Guardian handlers
  const updateGuardian = useCallback(
    (index: number, field: keyof GuardianFormData, value: unknown) => {
      setGuardians((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  const addGuardian = () => {
    if (guardians.length >= 4) return;
    setGuardians((prev) => [...prev, createEmptyGuardian(false)]);
  };

  const removeGuardian = (index: number) => {
    if (guardians.length <= 1) return;
    setGuardians((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Ensure at least one is primary
      if (!updated.some((g) => g.isPrimary) && updated.length > 0) {
        updated[0] = { ...updated[0], isPrimary: true };
      }
      return updated;
    });
    // Clean up fiscal expansion and dup check
    setExpandedFiscal((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setDupCheckValues((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handlePrimaryToggle = (index: number) => {
    setGuardians((prev) =>
      prev.map((g, i) => ({ ...g, isPrimary: i === index })),
    );
  };

  const toggleFiscal = (index: number) => {
    setExpandedFiscal((prev) => ({ ...prev, [index]: !prev[index] }));
    // Initialize fiscal data if toggling on and not yet set
    if (!expandedFiscal[index] && !guardians[index].fiscalData) {
      updateGuardian(index, 'fiscalData', { ...EMPTY_FISCAL_DATA });
    }
  };

  const updateFiscalField = (
    guardianIndex: number,
    field: keyof FiscalDataFormData,
    value: string,
  ) => {
    setGuardians((prev) => {
      const updated = [...prev];
      updated[guardianIndex] = {
        ...updated[guardianIndex],
        fiscalData: {
          ...(updated[guardianIndex].fiscalData ?? EMPTY_FISCAL_DATA),
          [field]: value,
        },
      };
      return updated;
    });
  };

  // Trigger duplicate check on blur (debounced by updating state)
  const handleDupCheckBlur = (index: number) => {
    const g = guardians[index];
    setDupCheckValues((prev) => ({
      ...prev,
      [index]: {
        phone: g.phone,
        phoneSecondary: g.phoneSecondary ?? '',
        email: g.email ?? '',
      },
    }));
  };

  // Validate form
  const validate = (): boolean => {
    if (!firstName.trim()) {
      setFormError('El nombre del alumno es requerido');
      return false;
    }
    if (!lastName1.trim()) {
      setFormError('El apellido paterno del alumno es requerido');
      return false;
    }
    if (!dateOfBirth) {
      setFormError('La fecha de nacimiento es requerida');
      return false;
    }
    if (!schoolCycleId) {
      setFormError('El ciclo escolar es requerido');
      return false;
    }
    if (!enrollmentDate) {
      setFormError('La fecha de inscripción es requerida');
      return false;
    }

    // Validate guardians
    for (let i = 0; i < guardians.length; i++) {
      const g = guardians[i];
      if (!g.firstName.trim()) {
        setFormError(`Tutor ${i + 1}: El nombre es requerido`);
        return false;
      }
      if (!g.lastName1.trim()) {
        setFormError(`Tutor ${i + 1}: El apellido paterno es requerido`);
        return false;
      }
      if (!g.phone.trim()) {
        setFormError(`Tutor ${i + 1}: El teléfono es requerido`);
        return false;
      }
      if (!g.relationship) {
        setFormError(`Tutor ${i + 1}: La relación es requerida`);
        return false;
      }
    }

    if (!guardians.some((g) => g.isPrimary)) {
      setFormError('Al menos un tutor debe ser marcado como principal');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!validate()) return;

    const payload: StudentFormData = {
      firstName: firstName.trim(),
      lastName1: lastName1.trim(),
      lastName2: lastName2.trim() || null,
      dateOfBirth,
      groupId: groupId === '' ? null : groupId,
      schoolCycleId: schoolCycleId as number,
      enrollmentDate,
      notes: notes.trim() || null,
      guardians: guardians.map((g) => ({
        ...g,
        firstName: g.firstName.trim(),
        lastName1: g.lastName1.trim(),
        lastName2: g.lastName2?.trim() || null,
        email: g.email?.trim() || null,
        phone: g.phone.trim(),
        phoneSecondary: g.phoneSecondary?.trim() || null,
        address: g.address?.trim() || null,
        // Clean fiscal data: remove if all required fields are empty
        fiscalData:
          g.fiscalData && g.fiscalData.rfc.trim()
            ? {
                ...g.fiscalData,
                rfc: g.fiscalData.rfc.trim(),
                businessName: g.fiscalData.businessName.trim(),
                cfdiUsage: g.fiscalData.cfdiUsage.trim(),
                fiscalRegime: g.fiscalData.fiscalRegime?.trim() || null,
                fiscalAddressStreet: g.fiscalData.fiscalAddressStreet.trim(),
                fiscalAddressExtNumber: g.fiscalData.fiscalAddressExtNumber?.trim() || null,
                fiscalAddressIntNumber: g.fiscalData.fiscalAddressIntNumber?.trim() || null,
                fiscalAddressNeighborhood: g.fiscalData.fiscalAddressNeighborhood?.trim() || null,
                fiscalAddressCity: g.fiscalData.fiscalAddressCity.trim(),
                fiscalAddressState: g.fiscalData.fiscalAddressState.trim(),
                fiscalAddressZip: g.fiscalData.fiscalAddressZip.trim(),
              }
            : null,
      })),
    };

    try {
      const student = await createMutation.mutateAsync(payload);
      enqueueSnackbar('Alumno registrado exitosamente', { variant: 'success' });
      navigate(`/alumnos/${student.id}`);
    } catch {
      setFormError('Error al registrar el alumno. Verifica los datos e intenta de nuevo.');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/alumnos')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Nuevo Alumno</Typography>
      </Box>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      {/* Student Info Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Datos del Alumno
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2, px: 1 }}>
            <TextField
              label="Nombre(s)"
              placeholder="ej. Juan Carlos"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Apellido Paterno"
              placeholder="ej. García"
              value={lastName1}
              onChange={(e) => setLastName1(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Apellido Materno"
              placeholder="ej. López"
              value={lastName2}
              onChange={(e) => setLastName2(e.target.value)}
              fullWidth
            />
            <DatePicker
              label="Fecha de Nacimiento"
              value={dateOfBirth ? dayjs(dateOfBirth) : null}
              onChange={(value: Dayjs | null) => setDateOfBirth(value?.format('YYYY-MM-DD') ?? '')}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <TextField
              select
              label="Ciclo Escolar"
              value={schoolCycleId}
              onChange={(e) => {
                setSchoolCycleId(Number(e.target.value));
                setGroupId('');
              }}
              required
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
              value={groupId}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : '')}
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
              value={enrollmentDate ? dayjs(enrollmentDate) : null}
              onChange={(value: Dayjs | null) => setEnrollmentDate(value?.format('YYYY-MM-DD') ?? '')}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </Box>
          <Box sx={{ px: 1 }}>
            <TextField
              label="Anotaciones"
              placeholder="ej. Alumno con beca parcial"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Guardians Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Tutores</Typography>
        <Button
          startIcon={<Add />}
          onClick={addGuardian}
          disabled={guardians.length >= 4}
          size="small"
        >
          Agregar Tutor
        </Button>
      </Box>

      {guardians.map((guardian, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            {/* Guardian header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Tutor {index + 1}
                </Typography>
                {guardian.isPrimary && (
                  <Chip label="Principal" color="primary" size="small" />
                )}
              </Box>
              <Box>
                {!guardian.isPrimary && (
                  <Button size="small" onClick={() => handlePrimaryToggle(index)}>
                    Marcar como principal
                  </Button>
                )}
                {guardians.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeGuardian(index)}
                    title="Eliminar tutor"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Guardian fields */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Nombre(s)"
                placeholder="ej. María"
                value={guardian.firstName}
                onChange={(e) => updateGuardian(index, 'firstName', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Apellido Paterno"
                placeholder="ej. García"
                value={guardian.lastName1}
                onChange={(e) => updateGuardian(index, 'lastName1', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Apellido Materno"
                placeholder="ej. López"
                value={guardian.lastName2 ?? ''}
                onChange={(e) => updateGuardian(index, 'lastName2', e.target.value)}
                fullWidth
              />
              <TextField
                label="Teléfono"
                placeholder="ej. 6141234567"
                value={guardian.phone}
                onChange={(e) => updateGuardian(index, 'phone', e.target.value)}
                onBlur={() => handleDupCheckBlur(index)}
                required
                fullWidth
              />
              <TextField
                label="Teléfono Secundario"
                placeholder="ej. 6149876543"
                value={guardian.phoneSecondary ?? ''}
                onChange={(e) => updateGuardian(index, 'phoneSecondary', e.target.value)}
                onBlur={() => handleDupCheckBlur(index)}
                fullWidth
              />
              <TextField
                label="Correo Electrónico"
                placeholder="ej. maria@gmail.com"
                value={guardian.email ?? ''}
                onChange={(e) => updateGuardian(index, 'email', e.target.value)}
                onBlur={() => handleDupCheckBlur(index)}
                fullWidth
              />
              <TextField
                select
                label="Relación"
                value={guardian.relationship}
                onChange={(e) => updateGuardian(index, 'relationship', e.target.value)}
                required
                fullWidth
              >
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <MenuItem key={rel} value={rel}>
                    {rel}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Dirección"
                placeholder="ej. Calle Reforma #123, Col. Centro"
                value={guardian.address ?? ''}
                onChange={(e) => updateGuardian(index, 'address', e.target.value)}
                fullWidth
                sx={{ gridColumn: { md: 'span 2' } }}
              />
            </Box>

            {/* Duplicate check alert */}
            {dupCheckValues[index] && (
              <GuardianDuplicateAlert
                phone={dupCheckValues[index].phone}
                phoneSecondary={dupCheckValues[index].phoneSecondary}
                email={dupCheckValues[index].email}
              />
            )}

            {/* Fiscal data toggle */}
            <Divider sx={{ my: 2 }} />
            <Button
              size="small"
              onClick={() => toggleFiscal(index)}
              endIcon={expandedFiscal[index] ? <ExpandLess /> : <ExpandMore />}
            >
              Datos Fiscales {expandedFiscal[index] ? '' : '(opcional)'}
            </Button>

            <Collapse in={expandedFiscal[index]}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                  gap: 2,
                  mt: 2,
                }}
              >
                <TextField
                  label="RFC"
                  placeholder="ej. GALO850101AB1"
                  value={guardian.fiscalData?.rfc ?? ''}
                  onChange={(e) => updateFiscalField(index, 'rfc', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Razón Social"
                  placeholder="ej. María García López"
                  value={guardian.fiscalData?.businessName ?? ''}
                  onChange={(e) => updateFiscalField(index, 'businessName', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Uso de CFDI"
                  placeholder="ej. D10 Pagos por servicios educativos"
                  value={guardian.fiscalData?.cfdiUsage ?? ''}
                  onChange={(e) => updateFiscalField(index, 'cfdiUsage', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Régimen Fiscal"
                  placeholder="ej. 612 Personas Físicas"
                  value={guardian.fiscalData?.fiscalRegime ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalRegime', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Calle"
                  placeholder="ej. Av. Reforma"
                  value={guardian.fiscalData?.fiscalAddressStreet ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalAddressStreet', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="No. Exterior"
                  placeholder="ej. 123"
                  value={guardian.fiscalData?.fiscalAddressExtNumber ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalAddressExtNumber', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="No. Interior"
                  placeholder="ej. A"
                  value={guardian.fiscalData?.fiscalAddressIntNumber ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalAddressIntNumber', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Colonia"
                  placeholder="ej. Centro"
                  value={guardian.fiscalData?.fiscalAddressNeighborhood ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalAddressNeighborhood', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Ciudad"
                  placeholder="ej. Chihuahua"
                  value={guardian.fiscalData?.fiscalAddressCity ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalAddressCity', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Estado"
                  placeholder="ej. Chihuahua"
                  value={guardian.fiscalData?.fiscalAddressState ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalAddressState', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Código Postal"
                  placeholder="ej. 31000"
                  value={guardian.fiscalData?.fiscalAddressZip ?? ''}
                  onChange={(e) => updateFiscalField(index, 'fiscalAddressZip', e.target.value)}
                  fullWidth
                />
              </Box>
              {/* Option to remove fiscal data */}
              <Button
                size="small"
                color="error"
                sx={{ mt: 1 }}
                onClick={() => {
                  updateGuardian(index, 'fiscalData', null);
                  setExpandedFiscal((prev) => ({ ...prev, [index]: false }));
                }}
              >
                Quitar datos fiscales
              </Button>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={() => navigate('/alumnos')}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Guardando...
            </>
          ) : (
            'Registrar Alumno'
          )}
        </Button>
      </Box>
    </Box>
  );
}
