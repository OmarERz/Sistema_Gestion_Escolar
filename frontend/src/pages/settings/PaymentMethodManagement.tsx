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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
} from '@/hooks/usePaymentMethods';
import type { PaymentMethod, PaymentMethodFormData } from '@/types/paymentMethod';

type SortKey = 'name' | 'isActive';
type SortDir = 'asc' | 'desc';

export default function PaymentMethodManagement() {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>({ name: '' });
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const { data: response, isLoading } = usePaymentMethods(page + 1, 20, sortBy, sortDir);
  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();

  const methods = response?.data ?? [];
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
    setEditingMethod(null);
    setFormData({ name: '' });
    setIsActive(true);
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({ name: method.name });
    setIsActive(method.isActive);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setFormError('El nombre es requerido');
      return;
    }

    try {
      if (editingMethod) {
        await updateMutation.mutateAsync({
          id: editingMethod.id,
          input: { ...formData, isActive },
        });
        enqueueSnackbar('Método de pago actualizado', { variant: 'success' });
      } else {
        await createMutation.mutateAsync(formData);
        enqueueSnackbar('Método de pago creado', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      setFormError('Error al guardar. Verifica que el nombre no esté duplicado.');
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Métodos de Pago</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Nuevo Método
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
                    {methods.map((method) => (
                      <TableRow key={method.id}>
                        <TableCell>{method.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={method.isActive ? 'Activo' : 'Inactivo'}
                            color={method.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(method)}
                            title="Editar"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {methods.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ py: 4 }}>
                          No hay métodos de pago registrados
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
        <DialogTitle>{editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Nombre"
            placeholder="ej. Efectivo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            autoFocus
          />
          {editingMethod && (
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
