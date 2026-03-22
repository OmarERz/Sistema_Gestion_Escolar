import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useStudents } from '@/hooks/useStudents';
import { useCreateWithdrawal } from '@/hooks/useWithdrawals';
import type { Student } from '@/types/student';

export default function WithdrawalForm() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reason, setReason] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Only search active students (can't withdraw already-withdrawn ones)
  const { data: studentsRes } = useStudents(1, 10, studentSearch || undefined, 'active');
  const students = studentsRes?.data ?? [];

  const createMutation = useCreateWithdrawal();

  const formatStudentName = (s: { firstName: string; lastName1: string; lastName2?: string | null }) =>
    [s.firstName, s.lastName1, s.lastName2].filter(Boolean).join(' ');

  const formatCurrency = (amount: number | string) =>
    Number(amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const handleSubmitClick = () => {
    if (!selectedStudent) {
      setFormError('Selecciona un alumno');
      return;
    }
    if (!reason.trim()) {
      setFormError('Ingresa el motivo de la baja');
      return;
    }
    setFormError('');
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedStudent) return;

    try {
      await createMutation.mutateAsync({
        studentId: selectedStudent.id,
        reason: reason.trim(),
        withdrawalDate,
      });
      enqueueSnackbar('Baja procesada exitosamente', { variant: 'success' });
      navigate('/bajas');
    } catch {
      enqueueSnackbar('Error al procesar la baja', { variant: 'error' });
    }
    setConfirmOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Nueva Baja</Typography>

      <Card sx={{ maxWidth: 700 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          {/* Student search */}
          <Autocomplete
            options={students}
            getOptionLabel={(o) => formatStudentName(o)}
            value={selectedStudent}
            onChange={(_, value) => {
              setSelectedStudent(value);
              setFormError('');
            }}
            onInputChange={(_, value) => setStudentSearch(value)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2">{formatStudentName(option)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.group?.name ?? 'Sin grupo'} — Adeudo: {formatCurrency(option.totalDebt)}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Alumno" placeholder="ej. García López" fullWidth />
            )}
            noOptionsText="No se encontraron alumnos activos"
            isOptionEqualToValue={(a, b) => a.id === b.id}
            sx={{ mb: 2 }}
          />

          {/* Student info card */}
          {selectedStudent && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>{formatStudentName(selectedStudent)}</strong>
              </Typography>
              <Typography variant="body2">
                Grupo: {selectedStudent.group?.name ?? 'Sin grupo'}
              </Typography>
              <Typography variant="body2">
                Adeudo pendiente: <strong>{formatCurrency(selectedStudent.totalDebt)}</strong>
              </Typography>
            </Alert>
          )}

          {/* Withdrawal date */}
          <TextField
            label="Fecha de Baja"
            type="date"
            value={withdrawalDate}
            onChange={(e) => setWithdrawalDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* Reason */}
          <TextField
            label="Motivo de la Baja"
            placeholder="ej. Cambio de escuela, motivos personales"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setFormError('');
            }}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate('/bajas')}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitClick}
              disabled={createMutation.isPending}
            >
              Procesar Baja
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Baja</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Se procesará la baja del alumno:
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>{formatStudentName(selectedStudent)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                El adeudo pendiente de <strong>{formatCurrency(selectedStudent.totalDebt)}</strong> será registrado como referencia.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                El historial académico y de pagos se conservará.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirm}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Procesando...' : 'Confirmar Baja'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
