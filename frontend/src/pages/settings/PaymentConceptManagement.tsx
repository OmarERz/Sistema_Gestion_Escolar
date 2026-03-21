import { useState } from 'react';
import NumberField from '@/components/common/NumberField';
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
  FormControlLabel,
  Checkbox,
  Switch,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  usePaymentConcepts,
  useCreatePaymentConcept,
  useUpdatePaymentConcept,
} from '@/hooks/usePaymentConcepts';
import type { PaymentConcept, PaymentConceptFormData } from '@/types/paymentConcept';

type SortKey = 'name' | 'type' | 'defaultAmount' | 'isMonthly' | 'isActive';
type SortDir = 'asc' | 'desc';

const INITIAL_FORM: PaymentConceptFormData = {
  name: '',
  type: 'mandatory',
  defaultAmount: 0,
  isMonthly: false,
};

export default function PaymentConceptManagement() {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<PaymentConcept | null>(null);
  const [formData, setFormData] = useState<PaymentConceptFormData>(INITIAL_FORM);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const { data: response, isLoading } = usePaymentConcepts(page + 1, 20, sortBy, sortDir);
  const createMutation = useCreatePaymentConcept();
  const updateMutation = useUpdatePaymentConcept();

  const concepts = response?.data ?? [];
  const total = response?.pagination?.total ?? 0;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const openCreateDialog = () => {
    setEditingConcept(null);
    setFormData(INITIAL_FORM);
    setIsActive(true);
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (concept: PaymentConcept) => {
    setEditingConcept(concept);
    setFormData({
      name: concept.name,
      type: concept.type,
      defaultAmount: Number(concept.defaultAmount),
      isMonthly: concept.isMonthly,
    });
    setIsActive(concept.isActive);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.defaultAmount <= 0) {
      setFormError('Nombre y monto son requeridos. El monto debe ser mayor a 0.');
      return;
    }

    try {
      if (editingConcept) {
        await updateMutation.mutateAsync({
          id: editingConcept.id,
          input: { ...formData, isActive },
        });
        enqueueSnackbar('Concepto actualizado', { variant: 'success' });
      } else {
        await createMutation.mutateAsync(formData);
        enqueueSnackbar('Concepto creado', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      setFormError('Error al guardar. Verifica los datos e intenta de nuevo.');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const formatCurrency = (amount: number | string) =>
    Number(amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Conceptos de Pago</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Nuevo Concepto
        </Button>
      </Box>

      <Card>
        <CardContent>
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
                          active={sortBy === 'name'}
                          direction={sortBy === 'name' ? sortDir : 'asc'}
                          onClick={() => handleSort('name')}
                        >
                          Nombre
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'type'}
                          direction={sortBy === 'type' ? sortDir : 'asc'}
                          onClick={() => handleSort('type')}
                        >
                          Tipo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'defaultAmount'}
                          direction={sortBy === 'defaultAmount' ? sortDir : 'asc'}
                          onClick={() => handleSort('defaultAmount')}
                        >
                          Monto
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'isMonthly'}
                          direction={sortBy === 'isMonthly' ? sortDir : 'asc'}
                          onClick={() => handleSort('isMonthly')}
                        >
                          Mensual
                        </TableSortLabel>
                      </TableCell>
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
                    {concepts.map((concept) => (
                      <TableRow key={concept.id}>
                        <TableCell>{concept.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={concept.type === 'mandatory' ? 'Obligatorio' : 'Opcional'}
                            color={concept.type === 'mandatory' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(concept.defaultAmount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={concept.isMonthly ? 'Sí' : 'No'}
                            color={concept.isMonthly ? 'info' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={concept.isActive ? 'Activo' : 'Inactivo'}
                            color={concept.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(concept)}
                            title="Editar"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {concepts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 4 }}>
                          No hay conceptos de pago registrados
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
        <DialogTitle>{editingConcept ? 'Editar Concepto' : 'Nuevo Concepto'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Nombre"
            placeholder="ej. Colegiatura"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            autoFocus
          />
          <TextField
            fullWidth
            select
            label="Tipo"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'mandatory' | 'optional' })}
            margin="normal"
          >
            <MenuItem value="mandatory">Obligatorio</MenuItem>
            <MenuItem value="optional">Opcional</MenuItem>
          </TextField>
          <NumberField
            fullWidth
            label="Monto por Defecto"
            placeholder="ej. 1500.00"
            value={formData.defaultAmount || ''}
            onValueChange={(v) => setFormData({ ...formData, defaultAmount: parseFloat(v) || 0 })}
            margin="normal"

            min={0}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isMonthly}
                onChange={(e) => setFormData({ ...formData, isMonthly: e.target.checked })}
              />
            }
            label="Es mensual"
            sx={{ mt: 1, display: 'block' }}
          />
          {editingConcept && (
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              }
              label="Activo"
              sx={{ mt: 1, display: 'block' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
