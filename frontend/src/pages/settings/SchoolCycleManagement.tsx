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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, CheckCircle } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useSchoolCycles,
  useCreateSchoolCycle,
  useUpdateSchoolCycle,
  useActivateSchoolCycle,
} from '@/hooks/useSchoolCycles';
import type { SchoolCycle, SchoolCycleFormData } from '@/types/schoolCycle';

export default function SchoolCycleManagement() {
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<SchoolCycle | null>(null);
  const [activatingCycle, setActivatingCycle] = useState<SchoolCycle | null>(null);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<SchoolCycleFormData>({
    name: '',
    startDate: '',
    endDate: '',
  });

  const { enqueueSnackbar } = useSnackbar();
  const { data: response, isLoading } = useSchoolCycles(page + 1);
  const createMutation = useCreateSchoolCycle();
  const updateMutation = useUpdateSchoolCycle();
  const activateMutation = useActivateSchoolCycle();

  const cycles = response?.data ?? [];
  const total = response?.pagination?.total ?? 0;

  const openCreateDialog = () => {
    setEditingCycle(null);
    setFormData({ name: '', startDate: '', endDate: '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (cycle: SchoolCycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      startDate: cycle.startDate.split('T')[0],
      endDate: cycle.endDate.split('T')[0],
    });
    setFormError('');
    setDialogOpen(true);
  };

  const openActivateConfirm = (cycle: SchoolCycle) => {
    setActivatingCycle(cycle);
    setConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      setFormError('Todos los campos son requeridos');
      return;
    }
    if (formData.endDate <= formData.startDate) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      if (editingCycle) {
        await updateMutation.mutateAsync({ id: editingCycle.id, input: formData });
        enqueueSnackbar('Ciclo actualizado', { variant: 'success' });
      } else {
        await createMutation.mutateAsync(formData);
        enqueueSnackbar('Ciclo creado', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      setFormError('Error al guardar. Verifica que el nombre no esté duplicado.');
    }
  };

  const handleActivate = async () => {
    if (!activatingCycle) return;
    try {
      await activateMutation.mutateAsync(activatingCycle.id);
      enqueueSnackbar(`Ciclo ${activatingCycle.name} activado`, { variant: 'success' });
      setConfirmOpen(false);
    } catch {
      enqueueSnackbar('Error al activar el ciclo', { variant: 'error' });
    }
  };

  const activeCycleName = cycles.find((c) => c.isActive && c.id !== activatingCycle?.id)?.name;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ciclos Escolares</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Nuevo Ciclo
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
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
                      <TableCell>Nombre</TableCell>
                      <TableCell>Fecha Inicio</TableCell>
                      <TableCell>Fecha Fin</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cycles.map((cycle) => (
                      <TableRow key={cycle.id}>
                        <TableCell>{cycle.name}</TableCell>
                        <TableCell>
                          {new Date(cycle.startDate).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          {new Date(cycle.endDate).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cycle.isActive ? 'Activo' : 'Inactivo'}
                            color={cycle.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(cycle)}
                            title="Editar"
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {!cycle.isActive && (
                            <IconButton
                              size="small"
                              onClick={() => openActivateConfirm(cycle)}
                              title="Activar"
                              color="primary"
                              sx={{ minWidth: 40, minHeight: 40 }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {cycles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          No hay ciclos escolares registrados
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
        <DialogTitle>{editingCycle ? 'Editar Ciclo' : 'Nuevo Ciclo'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Nombre"
            placeholder="ej. 2026-2027"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            autoFocus
          />
          <TextField
            fullWidth
            label="Fecha de Inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth
            label="Fecha de Fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activate Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Activar Ciclo</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Activar el ciclo <strong>{activatingCycle?.name}</strong>?
            {activeCycleName && (
              <> El ciclo actual (<strong>{activeCycleName}</strong>) será desactivado.</>
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleActivate}
            disabled={activateMutation.isPending}
          >
            {activateMutation.isPending ? 'Activando...' : 'Activar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
