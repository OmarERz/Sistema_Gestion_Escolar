import { useState, useEffect } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, CleaningServices } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useGroups,
  useCreateGroup,
  useUpdateGroup,
  useEmptyGroup,
  useDeleteGroup,
} from '@/hooks/useGroups';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import type { Group, GroupFormData } from '@/types/group';

const LEVEL_LABELS: Record<string, string> = {
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  prepa: 'Preparatoria',
};

const LEVEL_OPTIONS = [
  { value: 'kinder', label: 'Kinder' },
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'prepa', label: 'Preparatoria' },
] as const;

const MAX_GRADE: Record<string, number> = {
  kinder: 3,
  primaria: 6,
  secundaria: 3,
  prepa: 3,
};

function getGradeOptions(level: string): number[] {
  const max = MAX_GRADE[level] ?? 0;
  return Array.from({ length: max }, (_, i) => i + 1);
}

const INITIAL_FORM: GroupFormData = {
  schoolCycleId: 0,
  level: 'kinder',
  grade: '',
  section: '',
};

type SortKey = 'level' | 'grade' | 'section' | 'students' | 'promotionOrder';
type SortDir = 'asc' | 'desc';

export default function GroupList() {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('promotionOrder');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterCycleId, setFilterCycleId] = useState<number | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [targetGroup, setTargetGroup] = useState<Group | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<GroupFormData>(INITIAL_FORM);

  const { enqueueSnackbar } = useSnackbar();

  const { data: cyclesResponse } = useSchoolCycles(1, 100);
  const cycles = cyclesResponse?.data ?? [];

  useEffect(() => {
    if (filterCycleId === undefined && cycles.length > 0) {
      const active = cycles.find((c) => c.isActive);
      setFilterCycleId(active?.id ?? cycles[0].id);
    }
  }, [cycles, filterCycleId]);

  const { data: response, isLoading } = useGroups(page + 1, 20, filterCycleId, sortBy, sortDir);
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();
  const emptyMutation = useEmptyGroup();
  const deleteMutation = useDeleteGroup();

  const groups = response?.data ?? [];
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
    setEditingGroup(null);
    setFormData({
      ...INITIAL_FORM,
      schoolCycleId: filterCycleId ?? 0,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      schoolCycleId: group.schoolCycleId,
      level: group.level,
      grade: group.grade,
      section: group.section,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const openEmptyConfirm = (group: Group) => {
    setTargetGroup(group);
    setEmptyConfirmOpen(true);
  };

  const openDeleteConfirm = (group: Group) => {
    setTargetGroup(group);
    setDeleteConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!formData.schoolCycleId || !formData.level || !formData.grade || !formData.section) {
      setFormError('Todos los campos son requeridos');
      return;
    }

    try {
      if (editingGroup) {
        await updateMutation.mutateAsync({ id: editingGroup.id, input: formData });
        enqueueSnackbar('Grupo actualizado', { variant: 'success' });
      } else {
        await createMutation.mutateAsync(formData);
        enqueueSnackbar('Grupo creado', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      setFormError('Error al guardar. Verifica que el grupo no esté duplicado.');
    }
  };

  const handleEmpty = async () => {
    if (!targetGroup) return;
    try {
      const result = await emptyMutation.mutateAsync(targetGroup.id);
      enqueueSnackbar(
        `${result.removedCount} alumno(s) desvinculado(s) del grupo ${LEVEL_LABELS[targetGroup.level]} ${targetGroup.name}`,
        { variant: 'success' },
      );
      setEmptyConfirmOpen(false);
    } catch {
      enqueueSnackbar('Error al vaciar el grupo', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!targetGroup) return;
    try {
      await deleteMutation.mutateAsync(targetGroup.id);
      enqueueSnackbar('Grupo eliminado', { variant: 'success' });
      setDeleteConfirmOpen(false);
    } catch {
      enqueueSnackbar('Error al eliminar. El grupo debe estar vacío primero.', { variant: 'error' });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const gradeOptions = getGradeOptions(formData.level);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Grupos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Nuevo Grupo
        </Button>
      </Box>

      {/* Cycle filter */}
      <Box sx={{ mb: 2 }}>
        <TextField
          select
          label="Ciclo Escolar"
          value={filterCycleId ?? ''}
          onChange={(e) => {
            setFilterCycleId(Number(e.target.value));
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 200 }}
        >
          {cycles.map((cycle) => (
            <MenuItem key={cycle.id} value={cycle.id}>
              {cycle.name} {cycle.isActive ? '(Activo)' : ''}
            </MenuItem>
          ))}
        </TextField>
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
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'level' || sortBy === 'promotionOrder'}
                          direction={sortBy === 'level' || sortBy === 'promotionOrder' ? sortDir : 'asc'}
                          onClick={() => handleSort('promotionOrder')}
                        >
                          Nivel
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'grade'}
                          direction={sortBy === 'grade' ? sortDir : 'asc'}
                          onClick={() => handleSort('grade')}
                        >
                          Grado
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'section'}
                          direction={sortBy === 'section' ? sortDir : 'asc'}
                          onClick={() => handleSort('section')}
                        >
                          Sección
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Ciclo</TableCell>
                      <TableCell align="right">
                        <TableSortLabel
                          active={sortBy === 'students'}
                          direction={sortBy === 'students' ? sortDir : 'asc'}
                          onClick={() => handleSort('students')}
                        >
                          Alumnos
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{LEVEL_LABELS[group.level] ?? group.level}</TableCell>
                        <TableCell>{group.grade}</TableCell>
                        <TableCell>{group.section}</TableCell>
                        <TableCell>{group.schoolCycle.name}</TableCell>
                        <TableCell align="right">{group._count.students}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(group)}
                            title="Editar"
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {group._count.students > 0 ? (
                            <Tooltip title="Vaciar grupo (desvincular alumnos)">
                              <IconButton
                                size="small"
                                onClick={() => openEmptyConfirm(group)}
                                color="warning"
                                sx={{ minWidth: 40, minHeight: 40 }}
                              >
                                <CleaningServices fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Eliminar grupo">
                              <IconButton
                                size="small"
                                onClick={() => openDeleteConfirm(group)}
                                color="error"
                                sx={{ minWidth: 40, minHeight: 40 }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {groups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          No hay grupos registrados para este ciclo
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
        <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <TextField
            select
            fullWidth
            label="Ciclo Escolar"
            value={formData.schoolCycleId || ''}
            onChange={(e) => setFormData({ ...formData, schoolCycleId: Number(e.target.value) })}
            margin="normal"
          >
            {cycles.map((cycle) => (
              <MenuItem key={cycle.id} value={cycle.id}>
                {cycle.name} {cycle.isActive ? '(Activo)' : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Nivel"
            value={formData.level}
            onChange={(e) =>
              setFormData({ ...formData, level: e.target.value as GroupFormData['level'], grade: '' })
            }
            margin="normal"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Grado"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            margin="normal"
          >
            {gradeOptions.map((g) => (
              <MenuItem key={g} value={String(g)}>
                {g}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Sección"
            placeholder="ej. A"
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Empty Group Confirmation */}
      <Dialog open={emptyConfirmOpen} onClose={() => setEmptyConfirmOpen(false)}>
        <DialogTitle>Vaciar Grupo</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Desvincular a los <strong>{targetGroup?._count.students}</strong> alumno(s) del grupo{' '}
            <strong>
              {targetGroup ? `${LEVEL_LABELS[targetGroup.level]} ${targetGroup.name}` : ''}
            </strong>
            ? Los alumnos quedarán sin grupo asignado.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmptyConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleEmpty}
            disabled={emptyMutation.isPending}
          >
            {emptyMutation.isPending ? 'Vaciando...' : 'Vaciar Grupo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Group Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Eliminar Grupo</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar el grupo{' '}
            <strong>
              {targetGroup ? `${LEVEL_LABELS[targetGroup.level]} ${targetGroup.name}` : ''}
            </strong>
            ? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
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
