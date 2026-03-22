import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Undo, School } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useWithdrawals, useUndoWithdrawal } from '@/hooks/useWithdrawals';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import type { Withdrawal } from '@/types/withdrawal';

type SortKey = 'withdrawalDate' | 'pendingDebtAtWithdrawal' | 'student';
type SortDir = 'asc' | 'desc';

export default function WithdrawalHistory() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('withdrawalDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [searchFilter, setSearchFilter] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('');
  const [undoConfirm, setUndoConfirm] = useState<Withdrawal | null>(null);

  const filters = {
    search: searchFilter || undefined,
    schoolCycleId: cycleFilter ? parseInt(cycleFilter, 10) : undefined,
  };

  const { data: withdrawalsRes, isLoading } = useWithdrawals(
    page + 1, 20, sortBy, sortDir, filters,
  );
  const withdrawals = withdrawalsRes?.data ?? [];
  const total = withdrawalsRes?.pagination?.total ?? 0;

  const { data: cyclesRes } = useSchoolCycles(1, 100);
  const cycles = cyclesRes?.data ?? [];

  const undoMutation = useUndoWithdrawal();

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleUndo = async () => {
    if (!undoConfirm) return;
    try {
      await undoMutation.mutateAsync(undoConfirm.id);
      enqueueSnackbar('Baja deshecha exitosamente', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al deshacer la baja', { variant: 'error' });
    }
    setUndoConfirm(null);
  };

  const formatStudentName = (s: { firstName: string; lastName1: string; lastName2?: string | null }) =>
    [s.firstName, s.lastName1, s.lastName2].filter(Boolean).join(' ');

  const formatCurrency = (amount: number | string) =>
    Number(amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Historial de Bajas</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/bajas/nueva')}
        >
          Nueva Baja
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Buscar alumno"
              placeholder="ej. Juan García"
              value={searchFilter}
              onChange={(e) => { setSearchFilter(e.target.value); setPage(0); }}
              size="small"
              sx={{ width: 250 }}
            />
            <TextField
              select
              label="Ciclo Escolar"
              value={cycleFilter}
              onChange={(e) => { setCycleFilter(e.target.value); setPage(0); }}
              size="small"
              sx={{ width: 200 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {cycles.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Box>

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
                      <TableCell>Grupo</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'withdrawalDate'}
                          direction={sortBy === 'withdrawalDate' ? sortDir : 'asc'}
                          onClick={() => handleSort('withdrawalDate')}
                        >
                          Fecha de Baja
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'pendingDebtAtWithdrawal'}
                          direction={sortBy === 'pendingDebtAtWithdrawal' ? sortDir : 'asc'}
                          onClick={() => handleSort('pendingDebtAtWithdrawal')}
                        >
                          Adeudo al Momento
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Ciclo</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {withdrawals.map((w: Withdrawal) => (
                      <TableRow key={w.id}>
                        <TableCell>{formatStudentName(w.student)}</TableCell>
                        <TableCell>{w.student.group?.name ?? '—'}</TableCell>
                        <TableCell>
                          {new Date(w.withdrawalDate).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={w.reason} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 250,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'default',
                              }}
                            >
                              {w.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{formatCurrency(w.pendingDebtAtWithdrawal)}</TableCell>
                        <TableCell>{w.schoolCycle.name}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Deshacer Baja" arrow>
                            <IconButton
                              size="small"
                              onClick={() => setUndoConfirm(w)}
                            >
                              <Undo fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reinscribir" arrow>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/reinscripciones?withdrawalId=${w.id}`)}
                            >
                              <School fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {withdrawals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 4 }}>
                          No se encontraron bajas registradas
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

      {/* Undo confirmation dialog */}
      <Dialog open={undoConfirm !== null} onClose={() => setUndoConfirm(null)}>
        <DialogTitle>Deshacer Baja</DialogTitle>
        <DialogContent>
          {undoConfirm && (
            <Typography>
              ¿Deshacer la baja de <strong>{formatStudentName(undoConfirm.student)}</strong>?
              El alumno regresará a su estado activo con el mismo grupo y ciclo.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUndoConfirm(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUndo}
            disabled={undoMutation.isPending}
          >
            {undoMutation.isPending ? 'Procesando...' : 'Deshacer Baja'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
