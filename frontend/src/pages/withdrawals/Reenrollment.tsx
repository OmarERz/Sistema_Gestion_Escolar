import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  MenuItem,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useWithdrawals, useReenroll } from '@/hooks/useWithdrawals';
import { useGroups } from '@/hooks/useGroups';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import { useStudentPayments, usePayAllDebts } from '@/hooks/usePayments';
import { useGuardians } from '@/hooks/useGuardians';
import type { Withdrawal } from '@/types/withdrawal';
import type { Guardian } from '@/types/student';

const STEPS = ['Seleccionar Alumno', 'Datos de Reinscripción', 'Tutores', 'Adeudos', 'Confirmar'];

const LEVEL_LABELS: Record<string, string> = {
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  prepa: 'Preparatoria',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  overdue: 'Vencido',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'error'> = {
  pending: 'warning',
  partial: 'info',
  overdue: 'error',
};

export default function Reenrollment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // Stepper
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Select withdrawal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [withdrawalSearch, setWithdrawalSearch] = useState('');

  // Step 2: Enrollment data
  const [schoolCycleId, setSchoolCycleId] = useState<number | ''>('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().slice(0, 10));

  // Step 3: Guardians
  const [keepGuardianIds, setKeepGuardianIds] = useState<number[]>([]);
  const [addGuardianIds, setAddGuardianIds] = useState<number[]>([]);
  const [guardianSearch, setGuardianSearch] = useState('');

  // Step 4: Debts
  const [debtAction, setDebtAction] = useState<'keep' | 'payAll' | null>(null);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Data queries
  const { data: withdrawalsRes } = useWithdrawals(1, 50, 'student', 'asc', {
    search: withdrawalSearch || undefined,
  });
  const withdrawals = withdrawalsRes?.data ?? [];

  const { data: cyclesRes } = useSchoolCycles(1, 100);
  const cycles = cyclesRes?.data ?? [];

  const { data: groupsRes } = useGroups(1, 100, schoolCycleId ? schoolCycleId as number : undefined);
  const groups = groupsRes?.data ?? [];

  const { data: paymentsRes } = useStudentPayments(
    selectedWithdrawal?.studentId ?? null,
    1, 100, 'dueDate', 'asc', 'pending,partial,overdue',
  );
  const pendingPayments = paymentsRes?.data ?? [];

  const { data: guardiansRes } = useGuardians(1, 100, guardianSearch || undefined);
  const allGuardians = guardiansRes?.data ?? [];

  // Mutations
  const reenrollMutation = useReenroll();
  const payAllMutation = usePayAllDebts();

  // Pre-select withdrawal from URL param
  useEffect(() => {
    const wId = searchParams.get('withdrawalId');
    if (wId && withdrawals.length > 0 && !selectedWithdrawal) {
      const found = withdrawals.find(w => w.id === parseInt(wId, 10));
      if (found) {
        setSelectedWithdrawal(found);
        setActiveStep(1);
      }
    }
  }, [searchParams, withdrawals, selectedWithdrawal]);

  // When withdrawal is selected, initialize guardian list
  const studentGuardians = useMemo(() => {
    if (!selectedWithdrawal) return [];
    // We need to fetch the student's guardians — they are not included in the withdrawal response.
    // We'll use a separate approach: the guardians are fetched when we move to step 3.
    return [];
  }, [selectedWithdrawal]);

  // Fetch student's current guardians via the guardians list filtered
  // We need the student detail to get guardians — let's use the student API
  const [currentGuardians, setCurrentGuardians] = useState<{ id: number; firstName: string; lastName1: string; lastName2: string | null; relationship: string }[]>([]);

  useEffect(() => {
    if (selectedWithdrawal) {
      // Fetch student detail to get guardians
      import('@/api/students').then(api => {
        api.getStudentById(selectedWithdrawal.studentId).then(response => {
          const student = response.data;
          const guardians = student.guardians?.map((g: { guardian: { id: number; firstName: string; lastName1: string; lastName2?: string | null }; relationship: string }) => ({
            id: g.guardian.id,
            firstName: g.guardian.firstName,
            lastName1: g.guardian.lastName1,
            lastName2: g.guardian.lastName2 ?? null,
            relationship: g.relationship,
          })) ?? [];
          setCurrentGuardians(guardians);
          setKeepGuardianIds(guardians.map((g: { id: number }) => g.id));
        });
      });
    }
  }, [selectedWithdrawal]);

  const formatStudentName = (s: { firstName: string; lastName1: string; lastName2?: string | null }) =>
    [s.firstName, s.lastName1, s.lastName2].filter(Boolean).join(' ');

  const formatGuardianName = (g: { firstName: string; lastName1: string; lastName2?: string | null }) =>
    [g.firstName, g.lastName1, g.lastName2].filter(Boolean).join(' ');

  const formatCurrency = (amount: number | string) =>
    Number(amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  // Available guardians to add (not already linked)
  const availableGuardians = allGuardians.filter(
    g => !keepGuardianIds.includes(g.id) && !addGuardianIds.includes(g.id),
  );

  const hasPendingDebts = pendingPayments.length > 0;

  // Navigation
  const canProceedStep = (step: number) => {
    switch (step) {
      case 0: return selectedWithdrawal !== null;
      case 1: return schoolCycleId !== '' && groupId !== '' && enrollmentDate !== '';
      case 2: return keepGuardianIds.length + addGuardianIds.length > 0;
      case 3: return !hasPendingDebts || debtAction !== null;
      default: return true;
    }
  };

  const handleNext = () => {
    // Skip debt step if no pending debts
    if (activeStep === 2 && !hasPendingDebts) {
      setActiveStep(4);
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    // Skip debt step going back if no pending debts
    if (activeStep === 4 && !hasPendingDebts) {
      setActiveStep(2);
    } else {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleConfirm = async () => {
    if (!selectedWithdrawal || schoolCycleId === '' || groupId === '') return;

    try {
      // If user chose to pay all debts, do that first
      if (debtAction === 'payAll' && hasPendingDebts) {
        await payAllMutation.mutateAsync(selectedWithdrawal.studentId);
      }

      await reenrollMutation.mutateAsync({
        id: selectedWithdrawal.id,
        input: {
          groupId: groupId as number,
          schoolCycleId: schoolCycleId as number,
          enrollmentDate,
          keepGuardianIds,
          addGuardianIds: addGuardianIds.length > 0 ? addGuardianIds : undefined,
        },
      });
      enqueueSnackbar('Alumno reinscrito exitosamente', { variant: 'success' });
      navigate('/bajas');
    } catch {
      enqueueSnackbar('Error al procesar la reinscripción', { variant: 'error' });
    }
    setConfirmOpen(false);
  };

  const toggleGuardian = (id: number) => {
    setKeepGuardianIds(prev =>
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id],
    );
  };

  const removeAddedGuardian = (id: number) => {
    setAddGuardianIds(prev => prev.filter(gid => gid !== id));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Reinscripción</Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ maxWidth: 800 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>

          {/* Step 0: Select student */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Seleccionar Alumno con Baja</Typography>
              <Autocomplete
                options={withdrawals}
                getOptionLabel={(o) => formatStudentName(o.student)}
                value={selectedWithdrawal}
                onChange={(_, value) => setSelectedWithdrawal(value)}
                onInputChange={(_, value) => setWithdrawalSearch(value)}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="body2">{formatStudentName(option.student)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Baja: {new Date(option.withdrawalDate).toLocaleDateString('es-MX')}
                        {' — '}Adeudo: {formatCurrency(option.pendingDebtAtWithdrawal)}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar alumno dado de baja" placeholder="ej. García López" fullWidth />
                )}
                noOptionsText="No se encontraron alumnos con baja"
                isOptionEqualToValue={(a, b) => a.id === b.id}
              />
              {selectedWithdrawal && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{formatStudentName(selectedWithdrawal.student)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Fecha de baja: {new Date(selectedWithdrawal.withdrawalDate).toLocaleDateString('es-MX')}
                  </Typography>
                  <Typography variant="body2">
                    Motivo: {selectedWithdrawal.reason}
                  </Typography>
                  <Typography variant="body2">
                    Adeudo al momento de baja: {formatCurrency(selectedWithdrawal.pendingDebtAtWithdrawal)}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Step 1: Enrollment data */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Datos de Reinscripción</Typography>
              <TextField
                select
                label="Ciclo Escolar"
                value={schoolCycleId}
                onChange={(e) => {
                  setSchoolCycleId(parseInt(e.target.value, 10));
                  setGroupId('');
                }}
                fullWidth
                sx={{ mb: 2 }}
              >
                {cycles.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Grupo"
                value={groupId}
                onChange={(e) => setGroupId(parseInt(e.target.value, 10))}
                fullWidth
                sx={{ mb: 2 }}
                disabled={schoolCycleId === ''}
              >
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{LEVEL_LABELS[g.level] ?? g.level} — {g.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Fecha de Inscripción"
                type="date"
                value={enrollmentDate}
                onChange={(e) => setEnrollmentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          )}

          {/* Step 2: Guardians */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Tutores</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selecciona los tutores que se mantendrán vinculados al alumno.
              </Typography>

              {currentGuardians.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Tutores Actuales</Typography>
                  <TableContainer sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" />
                          <TableCell>Nombre</TableCell>
                          <TableCell>Relación</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentGuardians.map((g) => (
                          <TableRow key={g.id}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={keepGuardianIds.includes(g.id)}
                                onChange={() => toggleGuardian(g.id)}
                              />
                            </TableCell>
                            <TableCell>{formatGuardianName(g)}</TableCell>
                            <TableCell>{g.relationship}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Added guardians */}
              {addGuardianIds.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Tutores Nuevos</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {addGuardianIds.map((id) => {
                      const g = allGuardians.find(g => g.id === id);
                      return g ? (
                        <Chip
                          key={id}
                          label={formatGuardianName(g)}
                          onDelete={() => removeAddedGuardian(id)}
                        />
                      ) : null;
                    })}
                  </Box>
                </>
              )}

              {/* Search and add guardian */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Agregar Tutor Existente</Typography>
              <Autocomplete
                options={availableGuardians}
                getOptionLabel={(o: Guardian) => formatGuardianName(o)}
                value={null}
                onChange={(_, value) => {
                  if (value) {
                    setAddGuardianIds(prev => [...prev, value.id]);
                  }
                }}
                onInputChange={(_, value) => setGuardianSearch(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar tutor" placeholder="ej. María García" size="small" />
                )}
                noOptionsText="No se encontraron tutores"
                isOptionEqualToValue={(a, b) => a.id === b.id}
              />

              {keepGuardianIds.length + addGuardianIds.length === 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  El alumno debe tener al menos un tutor vinculado.
                </Alert>
              )}
            </Box>
          )}

          {/* Step 3: Debts */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Adeudos Pendientes</Typography>

              {pendingPayments.length === 0 ? (
                <Alert severity="success">El alumno no tiene adeudos pendientes.</Alert>
              ) : (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    El alumno tiene {pendingPayments.length} pago(s) pendiente(s).
                  </Alert>

                  <TableContainer sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Concepto</TableCell>
                          <TableCell>Monto</TableCell>
                          <TableCell>Pagado</TableCell>
                          <TableCell>Saldo</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Vencimiento</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingPayments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.paymentConcept.name}</TableCell>
                            <TableCell>{formatCurrency(p.finalAmount)}</TableCell>
                            <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                            <TableCell>{formatCurrency(Number(p.finalAmount) - Number(p.amountPaid))}</TableCell>
                            <TableCell>
                              <Chip
                                label={STATUS_LABELS[p.status] ?? p.status}
                                color={STATUS_COLORS[p.status] ?? 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {p.dueDate ? new Date(p.dueDate).toLocaleDateString('es-MX') : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    ¿Qué desea hacer con los adeudos?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={debtAction === 'keep' ? 'contained' : 'outlined'}
                      onClick={() => setDebtAction('keep')}
                    >
                      Mantener Adeudos
                    </Button>
                    <Button
                      variant={debtAction === 'payAll' ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => setDebtAction('payAll')}
                    >
                      Saldar Todos los Adeudos
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Step 4: Confirm */}
          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Confirmar Reinscripción</Typography>
              {selectedWithdrawal && (
                <Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Alumno:</strong> {formatStudentName(selectedWithdrawal.student)}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Ciclo:</strong> {cycles.find(c => c.id === schoolCycleId)?.name ?? '—'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Grupo:</strong> {(() => { const g = groups.find(g => g.id === groupId); return g ? `${LEVEL_LABELS[g.level] ?? g.level} — ${g.name}` : '—'; })()}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Fecha de Inscripción:</strong> {new Date(enrollmentDate).toLocaleDateString('es-MX')}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Tutores:</strong> {keepGuardianIds.length + addGuardianIds.length}
                  </Typography>
                  {hasPendingDebts && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Adeudos:</strong>{' '}
                      {debtAction === 'payAll' ? 'Se saldarán todos los adeudos' : 'Se mantienen los adeudos actuales'}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={activeStep === 0 ? () => navigate('/bajas') : handleBack}
            >
              {activeStep === 0 ? 'Cancelar' : 'Anterior'}
            </Button>
            {activeStep < 4 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canProceedStep(activeStep)}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setConfirmOpen(true)}
              >
                Reinscribir
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar Reinscripción</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Proceder con la reinscripción de <strong>{selectedWithdrawal ? formatStudentName(selectedWithdrawal.student) : ''}</strong>?
          </Typography>
          {debtAction === 'payAll' && hasPendingDebts && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Se saldarán todos los adeudos pendientes automáticamente.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={reenrollMutation.isPending || payAllMutation.isPending}
          >
            {(reenrollMutation.isPending || payAllMutation.isPending) ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
