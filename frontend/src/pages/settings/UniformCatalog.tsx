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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useUniformCatalog,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
} from '@/hooks/useUniforms';
import type { UniformCatalogItem, CreateCatalogData } from '@/types/uniform';

type SortKey = 'name' | 'basePrice' | 'isActive';
type SortDir = 'asc' | 'desc';

const INITIAL_FORM: CreateCatalogData = {
  name: '',
  description: '',
  basePrice: 0,
};

export default function UniformCatalog() {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UniformCatalogItem | null>(null);
  const [formData, setFormData] = useState<CreateCatalogData>(INITIAL_FORM);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { enqueueSnackbar } = useSnackbar();
  const { data: response, isLoading } = useUniformCatalog(page + 1, 20, sortBy, sortDir);
  const createMutation = useCreateCatalogItem();
  const updateMutation = useUpdateCatalogItem();
  const deleteMutation = useDeleteCatalogItem();

  const items = response?.data ?? [];
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
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setIsActive(true);
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (item: UniformCatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description ?? '',
      basePrice: Number(item.basePrice),
    });
    setIsActive(item.isActive);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.basePrice <= 0) {
      setFormError('Nombre y precio base son requeridos. El precio debe ser mayor a 0.');
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          input: { ...formData, description: formData.description || null, isActive },
        });
        enqueueSnackbar('Artículo actualizado', { variant: 'success' });
      } else {
        await createMutation.mutateAsync({ ...formData, description: formData.description || null });
        enqueueSnackbar('Artículo creado', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      setFormError('Error al guardar. Verifica los datos e intenta de nuevo.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      enqueueSnackbar('Artículo eliminado', { variant: 'success' });
    } catch {
      enqueueSnackbar('No se pudo eliminar. Puede tener pedidos asociados.', { variant: 'error' });
    }
    setConfirmDeleteId(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const formatCurrency = (amount: number | string) =>
    Number(amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Catálogo de Uniformes</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Nuevo Artículo
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
                      <TableCell>Descripción</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'basePrice'}
                          direction={sortBy === 'basePrice' ? sortDir : 'asc'}
                          onClick={() => handleSort('basePrice')}
                        >
                          Precio Base
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
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.description ?? '—'}</TableCell>
                        <TableCell>{formatCurrency(item.basePrice)}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.isActive ? 'Activo' : 'Inactivo'}
                            color={item.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(item)}
                            title="Editar"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {!item.isActive && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="Eliminar"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 4 }}>
                          No hay artículos de uniforme registrados
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
        <DialogTitle>{editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Nombre"
            placeholder="ej. Playera Polo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            autoFocus
          />
          <TextField
            fullWidth
            label="Descripción"
            placeholder="ej. Playera polo blanca con logo"
            value={formData.description ?? ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <NumberField
            fullWidth
            label="Precio Base"
            placeholder="ej. 350.00"
            value={formData.basePrice || ''}
            onValueChange={(v) => setFormData({ ...formData, basePrice: parseFloat(v) || 0 })}
            margin="normal"
            min={0}
          />
          {editingItem && (
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

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar este artículo del catálogo? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
