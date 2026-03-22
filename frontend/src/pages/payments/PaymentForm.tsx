import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useStudents } from '@/hooks/useStudents';
import { usePayments, useCreatePayment, useAddTransaction, usePayAllDebts, useResetStudentPayments } from '@/hooks/usePayments';
import { usePaymentConcepts } from '@/hooks/usePaymentConcepts';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import type { Student } from '@/types/student';
import type { Payment } from '@/types/payment';
import NumberField from '@/components/common/NumberField';

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  pending: 'warning',
  paid: 'success',
  partial: 'info',
  overdue: 'error',
  cancelled: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  partial: 'Parcial',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function PaymentForm() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, textWrap: 'balance' }}>Registrar Pago</Typography>
      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label="Pagar Deuda Existente" />
          <Tab label="Nuevo Pago" />
        </Tabs>
      </Card>
      {tab === 0 && <PayExistingDebt />}
      {tab === 1 && <NewPayment />}
    </Box>
  );
}

/** Mode 1: Pay existing debt — select student, see pending payments, add transaction */
function PayExistingDebt() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Transaction form
  const [txAmount, setTxAmount] = useState('');
  const [txMethodId, setTxMethodId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txReceipt, setTxReceipt] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Success dialog
  const [successOpen, setSuccessOpen] = useState(false);

  // Pay-all and reset dialogs
  const [confirmPayAllOpen, setConfirmPayAllOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const { data: studentsRes } = useStudents(1, 10, studentSearch || undefined, 'active');
  const students = studentsRes?.data ?? [];

  const { data: paymentsRes, isLoading: loadingPayments } = usePayments(
    1, 100, 'dueDate', 'asc',
    selectedStudent ? { studentId: selectedStudent.id, status: 'pending,partial,overdue' } : undefined,
  );
  const pendingPayments = paymentsRes?.data ?? [];

  const { data: methodsRes } = usePaymentMethods(1, 100);
  const methods = (methodsRes?.data ?? []).filter(m => m.isActive);

  const addTransactionMutation = useAddTransaction();
  const payAllDebtsMutation = usePayAllDebts();
  const resetPaymentsMutation = useResetStudentPayments();

  const handleSelectPayment = (payment: Payment) => {
    // Calculate remaining from the payment being clicked, not from stale state
    const paymentRemaining = Number(payment.finalAmount) - Number(payment.amountPaid);
    setSelectedPayment(payment);
    setTxAmount(paymentRemaining.toFixed(2));
    setTxMethodId('');
    setTxReceipt('');
    setTxNotes('');
    setFormError('');
  };

  const currentRemaining = selectedPayment
    ? Number(selectedPayment.finalAmount) - Number(selectedPayment.amountPaid)
    : 0;

  const handleSubmitTransaction = async () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) {
      setFormError('El monto debe ser mayor a 0');
      return;
    }
    if (amount > currentRemaining + 0.01) {
      setFormError(`El monto no puede exceder el saldo de $${currentRemaining.toFixed(2)}`);
      return;
    }
    if (!txMethodId) {
      setFormError('Selecciona un método de pago');
      return;
    }

    try {
      await addTransactionMutation.mutateAsync({
        paymentId: selectedPayment!.id,
        input: {
          amount,
          paymentMethodId: parseInt(txMethodId, 10),
          paymentDate: txDate,
          receiptNumber: txReceipt || null,
          notes: txNotes || null,
        },
      });
      setSelectedPayment(null);
      setSuccessOpen(true);
    } catch {
      setFormError('Error al registrar el abono');
    }
  };

  return (
    <>
      {/* Student search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Buscar alumno
          </Typography>
          <Autocomplete
            options={students}
            getOptionLabel={(o) => [o.firstName, o.lastName1, o.lastName2].filter(Boolean).join(' ')}
            value={selectedStudent}
            onChange={(_, value) => {
              setSelectedStudent(value);
              setSelectedPayment(null);
            }}
            onInputChange={(_, value) => setStudentSearch(value)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2">
                    {[option.firstName, option.lastName1, option.lastName2].filter(Boolean).join(' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.group?.name ?? 'Sin grupo'} · Deuda: ${Number(option.totalDebt).toFixed(2)}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} placeholder="ej. García López" fullWidth />
            )}
            noOptionsText="No se encontraron alumnos"
            isOptionEqualToValue={(a, b) => a.id === b.id}
          />
        </CardContent>
      </Card>

      {/* Pending payments table */}
      {selectedStudent && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
              <Typography variant="h6">Pagos Pendientes</Typography>
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Deuda total: <strong>${Number(selectedStudent.totalDebt).toFixed(2)}</strong>
              </Typography>
            </Box>
            {loadingPayments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingPayments.length === 0 ? (
              <Alert severity="info">Este alumno no tiene pagos pendientes</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Concepto</TableCell>
                      <TableCell>Mes</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Pagado</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingPayments.map((p) => {
                      const balance = Number(p.finalAmount) - Number(p.amountPaid);
                      return (
                        <TableRow
                          key={p.id}
                          hover
                          selected={selectedPayment?.id === p.id}
                          onClick={() => handleSelectPayment(p)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{p.paymentConcept.name}</TableCell>
                          <TableCell>{p.appliesToMonth ? MONTH_NAMES[p.appliesToMonth] : '—'}</TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            ${Number(p.finalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            ${Number(p.amountPaid).toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            ${balance.toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} size="small" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Action buttons */}
            {pendingPayments.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => setConfirmPayAllOpen(true)}
                  disabled={payAllDebtsMutation.isPending}
                >
                  {payAllDebtsMutation.isPending ? 'Pagando...' : 'Pagar Todo'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setConfirmResetOpen(true)}
                  disabled={resetPaymentsMutation.isPending}
                >
                  Resetear Pagos
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction form */}
      {selectedPayment && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
              <Typography variant="h6">
                Abonar a: {selectedPayment.paymentConcept.name}
                {selectedPayment.appliesToMonth ? ` — ${MONTH_NAMES[selectedPayment.appliesToMonth]}` : ''}
              </Typography>
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                Saldo pendiente: <strong>${currentRemaining.toFixed(2)}</strong>
              </Typography>
            </Box>

            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <NumberField
                label="Monto a pagar"
                placeholder="ej. 1500.00"
                value={txAmount}
                onValueChange={setTxAmount}

                min={0}
                max={currentRemaining}
                fullWidth
              />
              <TextField
                select
                label="Método de pago"
                value={txMethodId}
                onChange={(e) => setTxMethodId(e.target.value)}
                fullWidth
              >
                {methods.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Fecha de pago"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Recibo"
                placeholder="ej. REC-001"
                value={txReceipt}
                onChange={(e) => setTxReceipt(e.target.value)}
                fullWidth
              />
              <TextField
                label="Notas"
                placeholder="ej. Pago parcial"
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                sx={{ gridColumn: { md: '1 / -1' } }}
              />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setSelectedPayment(null)}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleSubmitTransaction}
                disabled={addTransactionMutation.isPending}
                sx={{ minWidth: 160 }}
              >
                {addTransactionMutation.isPending ? 'Guardando...' : 'Registrar Abono'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Success dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Pago registrado exitosamente</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas registrar otro pago para el mismo alumno?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSuccessOpen(false); navigate('/pagos/historial'); }}>
            No, ir al historial
          </Button>
          <Button variant="contained" onClick={() => setSuccessOpen(false)}>
            Sí, otro pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm pay-all dialog */}
      <Dialog open={confirmPayAllOpen} onClose={() => setConfirmPayAllOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Pagar Todo</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            Se registrará un abono por el monto restante de cada pago pendiente, parcial o vencido. Se utilizará el primer método de pago activo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPayAllOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            disabled={payAllDebtsMutation.isPending}
            onClick={async () => {
              if (!selectedStudent) return;
              try {
                const result = await payAllDebtsMutation.mutateAsync(selectedStudent.id);
                enqueueSnackbar(`Se saldaron ${result.settled} pago(s)`, { variant: 'success' });
                setConfirmPayAllOpen(false);
                setSelectedPayment(null);
              } catch {
                enqueueSnackbar('Error al saldar pagos', { variant: 'error' });
              }
            }}
          >
            {payAllDebtsMutation.isPending ? 'Procesando...' : 'Confirmar Pagar Todo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm reset dialog */}
      <Dialog open={confirmResetOpen} onClose={() => setConfirmResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Resetear Pagos</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 1 }}>
            Se eliminarán TODOS los pagos y transacciones de este alumno. La deuda quedará en $0. Esta acción es irreversible.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResetOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={resetPaymentsMutation.isPending}
            onClick={async () => {
              if (!selectedStudent) return;
              try {
                await resetPaymentsMutation.mutateAsync(selectedStudent.id);
                enqueueSnackbar('Pagos reseteados', { variant: 'success' });
                setConfirmResetOpen(false);
                setSelectedPayment(null);
              } catch {
                enqueueSnackbar('Error al resetear pagos', { variant: 'error' });
              }
            }}
          >
            {resetPaymentsMutation.isPending ? 'Procesando...' : 'Confirmar Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Mode 2: New payment — create payment + optional first transaction */
function NewPayment() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Payment fields
  const [conceptId, setConceptId] = useState('');
  const [month, setMonth] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [surcharge, setSurcharge] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [hasScholarship, setHasScholarship] = useState(false);

  // Transaction fields
  const [txAmount, setTxAmount] = useState('');
  const [txMethodId, setTxMethodId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txReceipt, setTxReceipt] = useState('');
  const [txNotes, setTxNotes] = useState('');

  const [formError, setFormError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const { data: studentsRes } = useStudents(1, 10, studentSearch || undefined, 'active');
  const students = studentsRes?.data ?? [];

  const { data: conceptsRes } = usePaymentConcepts(1, 100);
  const concepts = (conceptsRes?.data ?? []).filter(c => c.isActive);

  const { data: methodsRes } = usePaymentMethods(1, 100);
  const methods = (methodsRes?.data ?? []).filter(m => m.isActive);

  const { data: cyclesRes } = useSchoolCycles();
  const activeCycle = (cyclesRes?.data ?? []).find(c => c.isActive);

  const createPaymentMutation = useCreatePayment();

  const selectedConcept = concepts.find(c => c.id === parseInt(conceptId, 10));

  // Auto-fill baseAmount when concept changes
  const handleConceptChange = (value: string) => {
    setConceptId(value);
    const concept = concepts.find(c => c.id === parseInt(value, 10));
    if (concept) {
      setBaseAmount(concept.defaultAmount.toString());
    }
  };

  const studentScholarship = Number(selectedStudent?.scholarshipPercent ?? 0);

  // Calculate final amount live (including scholarship if applicable)
  const finalAmount = useMemo(() => {
    const base = parseFloat(baseAmount) || 0;
    const disc = parseFloat(discount) || 0;
    const sur = parseFloat(surcharge) || 0;
    const schl = hasScholarship ? studentScholarship : 0;
    return Math.round(base * (1 - disc / 100) * (1 - schl / 100) * (1 + sur / 100) * 100) / 100;
  }, [baseAmount, discount, surcharge, hasScholarship, studentScholarship]);

  const handleSubmit = async () => {
    if (!selectedStudent) { setFormError('Selecciona un alumno'); return; }
    if (!conceptId) { setFormError('Selecciona un concepto'); return; }
    if (!baseAmount || parseFloat(baseAmount) <= 0) { setFormError('El monto base debe ser mayor a 0'); return; }
    if (!activeCycle) { setFormError('No hay ciclo escolar activo'); return; }

    if (selectedConcept?.isMonthly && !month) {
      setFormError('Selecciona un mes para este concepto');
      return;
    }

    const txAmt = parseFloat(txAmount);
    if (txAmount && txAmt > finalAmount + 0.01) {
      setFormError(`El monto a pagar no puede exceder $${finalAmount.toFixed(2)}`);
      return;
    }
    if (txAmount && !txMethodId) {
      setFormError('Selecciona un método de pago');
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        studentId: selectedStudent.id,
        paymentConceptId: parseInt(conceptId, 10),
        schoolCycleId: activeCycle.id,
        appliesToMonth: selectedConcept?.isMonthly ? parseInt(month, 10) : null,
        baseAmount: parseFloat(baseAmount),
        discountPercent: parseFloat(discount) || 0,
        surchargePercent: parseFloat(surcharge) || 0,
        hasScholarship,
        dueDate: dueDate || null,
        notes: notes || null,
        ...(txAmount && txAmt > 0 ? {
          transaction: {
            amount: txAmt,
            paymentMethodId: parseInt(txMethodId, 10),
            paymentDate: txDate,
            receiptNumber: txReceipt || null,
            notes: txNotes || null,
          },
        } : {}),
      });
      setSuccessOpen(true);
    } catch {
      setFormError('Error al crear el pago. Verifica que no exista un pago duplicado.');
    }
  };

  const resetForm = () => {
    setConceptId('');
    setMonth('');
    setBaseAmount('');
    setDiscount('0');
    setSurcharge('0');
    setDueDate('');
    setNotes('');
    setHasScholarship(false);
    setTxAmount('');
    setTxMethodId('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxReceipt('');
    setTxNotes('');
    setFormError('');
  };

  return (
    <>
      {/* Student search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Buscar alumno
          </Typography>
          <Autocomplete
            options={students}
            getOptionLabel={(o) => [o.firstName, o.lastName1, o.lastName2].filter(Boolean).join(' ')}
            value={selectedStudent}
            onChange={(_, value) => { setSelectedStudent(value); resetForm(); }}
            onInputChange={(_, value) => setStudentSearch(value)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2">
                    {[option.firstName, option.lastName1, option.lastName2].filter(Boolean).join(' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.group?.name ?? 'Sin grupo'} · Deuda: ${Number(option.totalDebt).toFixed(2)}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} placeholder="ej. García López" fullWidth />
            )}
            noOptionsText="No se encontraron alumnos"
            isOptionEqualToValue={(a, b) => a.id === b.id}
          />

          {selectedStudent && (
            <Box sx={{ mt: 2.5, p: 2, bgcolor: 'action.hover', borderRadius: 1.5 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Alumno:</strong> {[selectedStudent.firstName, selectedStudent.lastName1, selectedStudent.lastName2].filter(Boolean).join(' ')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Grupo:</strong> {selectedStudent.group?.name ?? 'Sin grupo'} · <strong>Ciclo:</strong> {selectedStudent.schoolCycle?.name ?? '—'}
              </Typography>
              <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                <strong>Deuda actual:</strong> ${Number(selectedStudent.totalDebt).toFixed(2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Payment details */}
      {selectedStudent && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2.5 }}>Datos del pago</Typography>

            {formError && <Alert severity="error" sx={{ mb: 2.5 }}>{formError}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
              <TextField
                select
                label="Concepto"
                value={conceptId}
                onChange={(e) => handleConceptChange(e.target.value)}
                fullWidth
              >
                {concepts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name} (${c.defaultAmount})</MenuItem>
                ))}
              </TextField>

              {selectedConcept?.isMonthly && (
                <TextField
                  select
                  label="Mes"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  fullWidth
                >
                  {MONTH_NAMES.slice(1).map((name, i) => (
                    <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
                  ))}
                </TextField>
              )}

              <NumberField
                label="Monto base"
                placeholder="ej. 2800.00"
                value={baseAmount}
                onValueChange={setBaseAmount}

                min={0}
                fullWidth
              />

              <NumberField
                label="Descuento %"
                placeholder="ej. 10"
                value={discount}
                onValueChange={setDiscount}

                min={0}
                max={100}
                fullWidth
              />

              <NumberField
                label="Recargo %"
                placeholder="ej. 5"
                value={surcharge}
                onValueChange={setSurcharge}

                min={0}
                max={100}
                fullWidth
              />

              <TextField
                label="Monto final"
                value={`$${finalAmount.toFixed(2)}`}
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiInputBase-input': { color: 'text.secondary', fontVariantNumeric: 'tabular-nums' } }}
                fullWidth
              />

              <TextField
                label="Fecha de vencimiento"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Notas"
                placeholder="ej. Pago de inscripción"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                sx={{ gridColumn: { md: '2 / -1' } }}
              />
            </Box>

            {studentScholarship > 0 && (
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasScholarship}
                      onChange={(e) => setHasScholarship(e.target.checked)}
                    />
                  }
                  label={`Aplicar beca (${studentScholarship}%)`}
                />
                {hasScholarship && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Se aplicará un descuento adicional de {studentScholarship}% por beca. Monto final: ${finalAmount.toFixed(2)}
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction (optional first payment) */}
      {selectedStudent && conceptId && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>Pago inicial (opcional)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Si deseas registrar un abono junto con el pago, completa estos campos.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <NumberField
                label="Monto a pagar"
                placeholder="ej. 1500.00"
                value={txAmount}
                onValueChange={setTxAmount}

                min={0}
                max={finalAmount}
                fullWidth
              />
              <TextField
                select
                label="Método de pago"
                value={txMethodId}
                onChange={(e) => setTxMethodId(e.target.value)}
                fullWidth
              >
                {methods.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Fecha de pago"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Recibo"
                placeholder="ej. REC-001"
                value={txReceipt}
                onChange={(e) => setTxReceipt(e.target.value)}
                fullWidth
              />
              <TextField
                label="Notas del abono"
                placeholder="ej. Primer abono"
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                sx={{ gridColumn: { md: '1 / -1' } }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {selectedStudent && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
          <Button onClick={resetForm}>Limpiar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createPaymentMutation.isPending}
            sx={{ minWidth: 160 }}
          >
            {createPaymentMutation.isPending ? 'Guardando...' : 'Crear Pago'}
          </Button>
        </Box>
      )}

      {/* Success dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Pago creado exitosamente</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas registrar otro pago para el mismo alumno?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSuccessOpen(false); navigate('/pagos/historial'); }}>
            No, ir al historial
          </Button>
          <Button variant="contained" onClick={() => { setSuccessOpen(false); resetForm(); }}>
            Sí, otro pago
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
