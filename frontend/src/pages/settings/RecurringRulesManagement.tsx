import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useRecurringRules,
  useCreateRecurringRule,
  useUpdateRecurringRule,
  useDeleteRecurringRule,
  useGeneratePayments,
} from '@/hooks/useRecurringRules';
import { usePaymentConcepts } from '@/hooks/usePaymentConcepts';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import type { RecurringPaymentRule, RecurringRuleFormData } from '@/types/recurringRule';
import NumberField from '@/components/common/NumberField';

type SortKey = 'paymentConceptId' | 'schoolCycleId' | 'generationDay' | 'dueDay' | 'startMonth' | 'endMonth' | 'isActive';
type SortDir = 'asc' | 'desc';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const INITIAL_FORM: RecurringRuleFormData = {
  paymentConceptId: 0,
  schoolCycleId: 0,
  generationDay: 1,
  dueDay: 10,
  startMonth: 1,
  endMonth: 12,
  amount: null,
};

export default function RecurringRulesManagement() {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('paymentConceptId');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringPaymentRule | null>(null);
  const [formData, setFormData] = useState<RecurringRuleFormData>(INITIAL_FORM);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<RecurringPaymentRule | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  const { data: response, isLoading } = useRecurringRules(page + 1, 20, sortBy, sortDir);
  const { data: conceptsResponse } = usePaymentConcepts(1, 100);
  const { data: cyclesResponse } = useSchoolCycles(1, 100);
  const createMutation = useCreateRecurringRule();
  const updateMutation = useUpdateRecurringRule();
  const deleteMutation = useDeleteRecurringRule();
  const generateMutation = useGeneratePayments();

  const rules = response?.data ?? [];
  const total = response?.pagination?.total ?? 0;
  const concepts = conceptsResponse?.data ?? [];
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

  const openCreate = () => {
    setEditingRule(null);
    setFormData(INITIAL_FORM);
    setIsActive(true);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (rule: RecurringPaymentRule) => {
    setEditingRule(rule);
    setFormData({
      paymentConceptId: rule.paymentConceptId,
      schoolCycleId: rule.schoolCycleId,
      generationDay: rule.generationDay,
      dueDay: rule.dueDay,
      startMonth: rule.startMonth,
      endMonth: rule.endMonth,
      amount: rule.amount !== null ? Number(rule.amount) : null,
    });
    setIsActive(rule.isActive);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.paymentConceptId) {
      setFormError('Selecciona un concepto de pago.');
      return;
    }
    if (!formData.schoolCycleId) {
      setFormError('Selecciona un ciclo escolar.');
      return;
    }
    try {
      if (editingRule) {
        await updateMutation.mutateAsync({
          id: editingRule.id,
          input: { ...formData, isActive },
        });
        enqueueSnackbar('Regla actualizada', { variant: 'success' });
      } else {
        await createMutation.mutateAsync(formData);
        enqueueSnackbar('Regla creada', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      setFormError(editingRule ? 'Error al actualizar la regla.' : 'Error al crear la regla.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      enqueueSnackbar('Regla eliminada', { variant: 'success' });
      setConfirmDelete(null);
    } catch {
      enqueueSnackbar('Solo se pueden eliminar reglas inactivas', { variant: 'error' });
      setConfirmDelete(null);
    }
  };

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync();
      enqueueSnackbar(
        result.generated > 0
          ? `Se generaron ${result.generated} pago(s) (${result.skipped} omitido(s))`
          : `No se generaron pagos nuevos (${result.skipped} ya existían)`,
        { variant: result.generated > 0 ? 'success' : 'info' },
      );
    } catch {
      enqueueSnackbar('Error al generar pagos', { variant: 'error' });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Pagos Recurrentes</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generando...' : 'Generar Pagos Ahora'}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Nueva Regla
          </Button>
        </Box>
      </Box>

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
                          active={sortBy === 'paymentConceptId'}
                          direction={sortBy === 'paymentConceptId' ? sortDir : 'asc'}
                          onClick={() => handleSort('paymentConceptId')}
                        >
                          Concepto
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'schoolCycleId'}
                          direction={sortBy === 'schoolCycleId' ? sortDir : 'asc'}
                          onClick={() => handleSort('schoolCycleId')}
                        >
                          Ciclo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'generationDay'}
                          direction={sortBy === 'generationDay' ? sortDir : 'asc'}
                          onClick={() => handleSort('generationDay')}
                        >
                          Día Gen.
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'dueDay'}
                          direction={sortBy === 'dueDay' ? sortDir : 'asc'}
                          onClick={() => handleSort('dueDay')}
                        >
                          Día Venc.
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'startMonth'}
                          direction={sortBy === 'startMonth' ? sortDir : 'asc'}
                          onClick={() => handleSort('startMonth')}
                        >
                          Mes Inicio
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'endMonth'}
                          direction={sortBy === 'endMonth' ? sortDir : 'asc'}
                          onClick={() => handleSort('endMonth')}
                        >
                          Mes Fin
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'isActive'}
                          direction={sortBy === 'isActive' ? sortDir : 'asc'}
                          onClick={() => handleSort('isActive')}
                        >
                          Estado
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id} hover>
                        <TableCell>{rule.paymentConcept.name}</TableCell>
                        <TableCell>{rule.schoolCycle.name}</TableCell>
                        <TableCell>{rule.generationDay}</TableCell>
                        <TableCell>{rule.dueDay}</TableCell>
                        <TableCell>{MONTH_NAMES[rule.startMonth]}</TableCell>
                        <TableCell>{MONTH_NAMES[rule.endMonth]}</TableCell>
                        <TableCell>
                          {rule.amount !== null
                            ? Number(rule.amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                            : `Concepto (${Number(rule.paymentConcept.defaultAmount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })})`}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rule.isActive ? 'Activa' : 'Inactiva'}
                            color={rule.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => openEdit(rule)} title="Editar">
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirmDelete(rule)}
                              title="Eliminar"
                              disabled={rule.isActive}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 4 }}>
                          No hay reglas recurrentes configuradas
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla Recurrente'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}

          <TextField
            fullWidth
            select
            label="Concepto de Pago"
            value={formData.paymentConceptId || ''}
            onChange={(e) => setFormData({ ...formData, paymentConceptId: Number(e.target.value) })}
            margin="normal"
          >
            <MenuItem value="" disabled>Seleccionar concepto</MenuItem>
            {concepts.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Ciclo Escolar"
            value={formData.schoolCycleId || ''}
            onChange={(e) => setFormData({ ...formData, schoolCycleId: Number(e.target.value) })}
            margin="normal"
          >
            <MenuItem value="" disabled>Seleccionar ciclo</MenuItem>
            {cycles.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <NumberField
              fullWidth
              label="Día de Generación"
              placeholder="ej. 1"
              value={formData.generationDay}
              onValueChange={(v) => setFormData({ ...formData, generationDay: parseInt(v) || 1 })}
              margin="normal"
              min={1}
              max={28}
            />
            <NumberField
              fullWidth
              label="Día de Vencimiento"
              placeholder="ej. 10"
              value={formData.dueDay}
              onValueChange={(v) => setFormData({ ...formData, dueDay: parseInt(v) || 1 })}
              margin="normal"
              min={1}
              max={28}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              select
              label="Mes Inicio"
              value={formData.startMonth}
              onChange={(e) => setFormData({ ...formData, startMonth: Number(e.target.value) })}
              margin="normal"
            >
              {MONTH_NAMES.slice(1).map((name, i) => (
                <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Mes Fin"
              value={formData.endMonth}
              onChange={(e) => setFormData({ ...formData, endMonth: Number(e.target.value) })}
              margin="normal"
            >
              {MONTH_NAMES.slice(1).map((name, i) => (
                <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
              ))}
            </TextField>
          </Box>

          <NumberField
            fullWidth
            label="Monto (dejar vacío para usar monto del concepto)"
            placeholder="ej. 2500"
            value={formData.amount ?? ''}
            onValueChange={(v) => setFormData({ ...formData, amount: v ? parseFloat(v) || null : null })}
            margin="normal"
            min={0}
          />

          {editingRule && (
            <FormControlLabel
              control={
                <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              }
              label="Regla activa"
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : editingRule ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Regla</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar la regla de "{confirmDelete?.paymentConcept.name}" para el ciclo {confirmDelete?.schoolCycle.name}? Esta acción es irreversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
