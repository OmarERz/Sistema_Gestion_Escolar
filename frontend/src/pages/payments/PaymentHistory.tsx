import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  usePayments,
  useUpdatePayment,
  useDeletePayment,
  useCancelPayment,
  useRemoveTransaction,
  useCheckOverdue,
} from '@/hooks/usePayments';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import type { Payment, UpdatePaymentFormData } from '@/types/payment';
import NumberField from '@/components/common/NumberField';

type SortKey = 'student' | 'paymentConceptId' | 'finalAmount' | 'amountPaid' | 'status' | 'dueDate' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'info' | 'error' | 'default'> = {
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

const formatCurrency = (amount: number | string) =>
  Number(amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const formatDate = (date: string | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const studentFullName = (s: Payment['student']) =>
  `${s.firstName} ${s.lastName1}${s.lastName2 ? ' ' + s.lastName2 : ''}`;

export default function PaymentHistory() {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cycleFilter, setCycleFilter] = useState('');

  // Detail dialog
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState<UpdatePaymentFormData>({});
  const [editError, setEditError] = useState('');

  // Confirm dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'cancel' | 'removeTransaction';
    paymentId?: number;
    transactionId?: number;
    label: string;
  } | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  const filters = {
    search: search || undefined,
    status: statusFilter || undefined,
    schoolCycleId: cycleFilter ? Number(cycleFilter) : undefined,
  };

  const { data: response, isLoading } = usePayments(page + 1, 20, sortBy, sortDir, filters);
  const { data: cyclesResponse } = useSchoolCycles(1, 100);
  const updateMutation = useUpdatePayment();
  const deleteMutation = useDeletePayment();
  const cancelMutation = useCancelPayment();
  const removeTransactionMutation = useRemoveTransaction();
  const checkOverdueMutation = useCheckOverdue();

  const payments = response?.data ?? [];
  const total = response?.pagination?.total ?? 0;
  const cycles = cyclesResponse?.data ?? [];

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleCheckOverdue = async () => {
    try {
      const result = await checkOverdueMutation.mutateAsync();
      enqueueSnackbar(
        result.updated > 0
          ? `${result.updated} pago(s) marcado(s) como vencido(s)`
          : 'No hay pagos vencidos nuevos',
        { variant: result.updated > 0 ? 'warning' : 'info' },
      );
    } catch {
      enqueueSnackbar('Error al verificar pagos vencidos', { variant: 'error' });
    }
  };

  // Detail dialog helpers
  const openDetail = (payment: Payment) => setDetailPayment(payment);
  const closeDetail = () => setDetailPayment(null);

  // Edit dialog helpers
  const openEdit = (payment: Payment) => {
    setEditPayment(payment);
    setEditForm({
      baseAmount: Number(payment.baseAmount),
      discountPercent: Number(payment.discountPercent),
      surchargePercent: Number(payment.surchargePercent),
      dueDate: payment.dueDate ? payment.dueDate.split('T')[0] : '',
      notes: payment.notes ?? '',
    });
    setEditError('');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editPayment) return;
    if (editForm.baseAmount !== undefined && editForm.baseAmount <= 0) {
      setEditError('El monto base debe ser mayor a 0.');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editPayment.id, input: editForm });
      enqueueSnackbar('Pago actualizado', { variant: 'success' });
      setEditDialogOpen(false);
      // Refresh detail if open
      if (detailPayment?.id === editPayment.id) closeDetail();
    } catch {
      setEditError('Error al actualizar el pago.');
    }
  };

  // Confirm action handlers
  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'delete' && confirmAction.paymentId) {
        await deleteMutation.mutateAsync(confirmAction.paymentId);
        enqueueSnackbar('Pago eliminado', { variant: 'success' });
        if (detailPayment?.id === confirmAction.paymentId) closeDetail();
      } else if (confirmAction.type === 'cancel' && confirmAction.paymentId) {
        await cancelMutation.mutateAsync(confirmAction.paymentId);
        enqueueSnackbar('Pago cancelado', { variant: 'success' });
        if (detailPayment?.id === confirmAction.paymentId) closeDetail();
      } else if (confirmAction.type === 'removeTransaction' && confirmAction.transactionId) {
        await removeTransactionMutation.mutateAsync(confirmAction.transactionId);
        enqueueSnackbar('Abono eliminado', { variant: 'success' });
        closeDetail();
      }
    } catch {
      enqueueSnackbar('Error al realizar la acción', { variant: 'error' });
    }
    setConfirmAction(null);
  };

  const isConfirming = deleteMutation.isPending || cancelMutation.isPending || removeTransactionMutation.isPending;

  const remaining = (p: Payment) => Number(p.finalAmount) - Number(p.amountPaid);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Historial de Pagos</Typography>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<Warning />}
          onClick={handleCheckOverdue}
          disabled={checkOverdueMutation.isPending}
        >
          {checkOverdueMutation.isPending ? 'Verificando...' : 'Verificar Vencidos'}
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Buscar alumno"
              placeholder="ej. Juan Pérez"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ minWidth: 220, flex: 1 }}
            />
            <TextField
              size="small"
              select
              label="Estado"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="paid">Pagado</MenuItem>
              <MenuItem value="partial">Parcial</MenuItem>
              <MenuItem value="overdue">Vencido</MenuItem>
              <MenuItem value="cancelled">Cancelado</MenuItem>
            </TextField>
            <TextField
              size="small"
              select
              label="Ciclo Escolar"
              value={cycleFilter}
              onChange={(e) => { setCycleFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {cycles.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Main table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'student'}
                          direction={sortBy === 'student' ? sortDir : 'asc'}
                          onClick={() => handleSort('student')}
                        >
                          Alumno
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'paymentConceptId'}
                          direction={sortBy === 'paymentConceptId' ? sortDir : 'asc'}
                          onClick={() => handleSort('paymentConceptId')}
                        >
                          Concepto
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Mes</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'finalAmount'}
                          direction={sortBy === 'finalAmount' ? sortDir : 'asc'}
                          onClick={() => handleSort('finalAmount')}
                        >
                          Monto Final
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'amountPaid'}
                          direction={sortBy === 'amountPaid' ? sortDir : 'asc'}
                          onClick={() => handleSort('amountPaid')}
                        >
                          Pagado
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Saldo</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'status'}
                          direction={sortBy === 'status' ? sortDir : 'asc'}
                          onClick={() => handleSort('status')}
                        >
                          Estado
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'dueDate'}
                          direction={sortBy === 'dueDate' ? sortDir : 'asc'}
                          onClick={() => handleSort('dueDate')}
                        >
                          Vencimiento
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow
                        key={p.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => openDetail(p)}
                      >
                        <TableCell>{studentFullName(p.student)}</TableCell>
                        <TableCell>{p.paymentConcept.name}</TableCell>
                        <TableCell>{p.appliesToMonth ? MONTH_NAMES[p.appliesToMonth] : '—'}</TableCell>
                        <TableCell>{formatCurrency(p.finalAmount)}</TableCell>
                        <TableCell>{formatCurrency(p.amountPaid)}</TableCell>
                        <TableCell>{formatCurrency(remaining(p))}</TableCell>
                        <TableCell>
                          <Chip
                            label={STATUS_LABELS[p.status] ?? p.status}
                            color={STATUS_COLORS[p.status] ?? 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(p.dueDate)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => openDetail(p)} title="Ver detalle">
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => openEdit(p)} title="Editar" disabled={p.status === 'cancelled'}>
                              <Edit fontSize="small" />
                            </IconButton>
                            {p.status !== 'cancelled' && (
                              <IconButton
                                size="small"
                                onClick={() => setConfirmAction({ type: 'cancel', paymentId: p.id, label: `¿Cancelar el pago de "${p.paymentConcept.name}" para ${studentFullName(p.student)}?` })}
                                title="Cancelar pago"
                                color="warning"
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => setConfirmAction({ type: 'delete', paymentId: p.id, label: `¿Eliminar el pago de "${p.paymentConcept.name}" para ${studentFullName(p.student)}? Esta acción es irreversible.` })}
                              title="Eliminar"
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 4 }}>
                          No se encontraron pagos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={20}
                rowsPerPageOptions={[20]}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailPayment !== null} onClose={closeDetail} maxWidth="md" fullWidth>
        {detailPayment && (
          <>
            <DialogTitle>
              Detalle de Pago — {detailPayment.paymentConcept.name}
            </DialogTitle>
            <DialogContent>
              {/* Student & payment info */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Alumno</Typography>
                  <Typography variant="body1">{studentFullName(detailPayment.student)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Concepto</Typography>
                  <Typography variant="body1">{detailPayment.paymentConcept.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Ciclo Escolar</Typography>
                  <Typography variant="body1">{detailPayment.schoolCycle?.name ?? '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Mes</Typography>
                  <Typography variant="body1">{detailPayment.appliesToMonth ? MONTH_NAMES[detailPayment.appliesToMonth] : '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Estado</Typography>
                  <Chip
                    label={STATUS_LABELS[detailPayment.status] ?? detailPayment.status}
                    color={STATUS_COLORS[detailPayment.status] ?? 'default'}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Amount breakdown */}
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Desglose de Montos</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Monto Base</Typography>
                  <Typography variant="body1">{formatCurrency(detailPayment.baseAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Descuento</Typography>
                  <Typography variant="body1">{Number(detailPayment.discountPercent)}%</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Recargo</Typography>
                  <Typography variant="body1">{Number(detailPayment.surchargePercent)}%</Typography>
                </Box>
                {detailPayment.hasScholarship && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Beca</Typography>
                    <Typography variant="body1">{Number(detailPayment.scholarshipPercent)}%</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary">Monto Final</Typography>
                  <Typography variant="body1" fontWeight={600}>{formatCurrency(detailPayment.finalAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Pagado</Typography>
                  <Typography variant="body1" color="success.main">{formatCurrency(detailPayment.amountPaid)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Saldo</Typography>
                  <Typography variant="body1" color={remaining(detailPayment) > 0 ? 'error.main' : 'success.main'}>
                    {formatCurrency(remaining(detailPayment))}
                  </Typography>
                </Box>
              </Box>

              {detailPayment.dueDate && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">Fecha de Vencimiento</Typography>
                  <Typography variant="body1">{formatDate(detailPayment.dueDate)}</Typography>
                </Box>
              )}

              {detailPayment.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">Notas</Typography>
                  <Typography variant="body1">{detailPayment.notes}</Typography>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* Transactions */}
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Abonos ({detailPayment.transactions?.length ?? 0})
              </Typography>
              {detailPayment.transactions && detailPayment.transactions.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Monto</TableCell>
                        <TableCell>Método</TableCell>
                        <TableCell>Recibo</TableCell>
                        <TableCell>Notas</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailPayment.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(tx.paymentDate)}</TableCell>
                          <TableCell>{formatCurrency(tx.amount)}</TableCell>
                          <TableCell>{tx.paymentMethod?.name ?? '—'}</TableCell>
                          <TableCell>{tx.receiptNumber ?? '—'}</TableCell>
                          <TableCell>{tx.notes ?? '—'}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirmAction({
                                type: 'removeTransaction',
                                transactionId: tx.id,
                                label: `¿Eliminar abono de ${formatCurrency(tx.amount)}? Se recalculará el saldo del pago.`,
                              })}
                              title="Eliminar abono"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No hay abonos registrados
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => openEdit(detailPayment)}
                disabled={detailPayment.status === 'cancelled'}
                startIcon={<Edit />}
              >
                Editar
              </Button>
              {detailPayment.status !== 'cancelled' && (
                <Button
                  color="warning"
                  onClick={() => setConfirmAction({
                    type: 'cancel',
                    paymentId: detailPayment.id,
                    label: `¿Cancelar este pago? El estado cambiará a "Cancelado" y no se contará en la deuda.`,
                  })}
                  startIcon={<Cancel />}
                >
                  Cancelar Pago
                </Button>
              )}
              <Button
                color="error"
                onClick={() => setConfirmAction({
                  type: 'delete',
                  paymentId: detailPayment.id,
                  label: `¿Eliminar este pago y todos sus abonos? Esta acción es irreversible.`,
                })}
                startIcon={<Delete />}
              >
                Eliminar
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={closeDetail}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Pago</DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{editError}</Alert>
          )}
          <NumberField
            fullWidth
            label="Monto Base"
            placeholder="ej. 1500"
            value={editForm.baseAmount ?? ''}
            onValueChange={(v) => setEditForm({ ...editForm, baseAmount: parseFloat(v) || 0 })}
            margin="normal"
            min={0}
          />
          <NumberField
            fullWidth
            label="Descuento %"
            placeholder="ej. 10"
            value={editForm.discountPercent ?? ''}
            onValueChange={(v) => setEditForm({ ...editForm, discountPercent: parseFloat(v) || 0 })}
            margin="normal"
            min={0}
            max={100}
          />
          <NumberField
            fullWidth
            label="Recargo %"
            placeholder="ej. 5"
            value={editForm.surchargePercent ?? ''}
            onValueChange={(v) => setEditForm({ ...editForm, surchargePercent: parseFloat(v) || 0 })}
            margin="normal"
            min={0}
          />
          <TextField
            fullWidth
            label="Fecha de Vencimiento"
            placeholder="ej. 2026-04-10"
            type="date"
            value={editForm.dueDate ?? ''}
            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value || null })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Notas"
            placeholder="ej. Pago con descuento especial"
            value={editForm.notes ?? ''}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value || null })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmAction !== null} onClose={() => setConfirmAction(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Acción</DialogTitle>
        <DialogContent>
          <Typography>{confirmAction?.label}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={confirmAction?.type === 'cancel' ? 'warning' : 'error'}
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
