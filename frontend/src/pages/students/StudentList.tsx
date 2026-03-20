import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { useStudents } from '@/hooks/useStudents';
import { useSchoolCycles } from '@/hooks/useSchoolCycles';
import { useGroups } from '@/hooks/useGroups';

const LEVEL_LABELS: Record<string, string> = {
  kinder: 'Kinder',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  prepa: 'Preparatoria',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  withdrawn: 'Baja',
};

const STATUS_COLORS: Record<string, 'success' | 'default' | 'error'> = {
  active: 'success',
  inactive: 'default',
  withdrawn: 'error',
};

type SortKey = 'firstName' | 'lastName1' | 'enrollmentDate' | 'totalDebt' | 'status' | 'group';
type SortDir = 'asc' | 'desc';

export default function StudentList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('lastName1');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterCycleId, setFilterCycleId] = useState<number | undefined>(undefined);
  const [filterGroupId, setFilterGroupId] = useState<number | 'none' | undefined>(undefined);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: cyclesResponse } = useSchoolCycles(1, 100);
  const cycles = cyclesResponse?.data ?? [];

  // Set active cycle as default filter
  useEffect(() => {
    if (filterCycleId === undefined && cycles.length > 0) {
      const active = cycles.find((c) => c.isActive);
      setFilterCycleId(active?.id ?? cycles[0].id);
    }
  }, [cycles, filterCycleId]);

  const { data: groupsResponse } = useGroups(1, 100, filterCycleId, 'promotionOrder', 'asc');
  const groups = groupsResponse?.data ?? [];

  const noGroup = filterGroupId === 'none';
  const groupIdParam = typeof filterGroupId === 'number' ? filterGroupId : undefined;

  const { data: response, isLoading } = useStudents(
    page + 1,
    20,
    debouncedSearch || undefined,
    filterStatus || undefined,
    filterCycleId,
    groupIdParam,
    sortBy,
    sortDir,
    noGroup,
  );

  const students = response?.data ?? [];
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

  const handleCycleChange = (cycleId: number) => {
    setFilterCycleId(cycleId);
    setFilterGroupId(undefined);
    setPage(0);
  };

  const handleGroupChange = (value: string) => {
    if (value === '') setFilterGroupId(undefined);
    else if (value === 'none') setFilterGroupId('none');
    else setFilterGroupId(Number(value));
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Alumnos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/alumnos/nuevo')}>
          Nuevo Alumno
        </Button>
      </Box>

      {/* Search and filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="ej. Juan Pérez"
          label="Buscar alumno"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
        />
        <TextField
          select
          label="Estado"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="active">Activo</MenuItem>
          <MenuItem value="inactive">Inactivo</MenuItem>
          <MenuItem value="withdrawn">Baja</MenuItem>
        </TextField>
        <TextField
          select
          label="Ciclo Escolar"
          value={filterCycleId ?? ''}
          onChange={(e) => handleCycleChange(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 180 }}
        >
          {cycles.map((cycle) => (
            <MenuItem key={cycle.id} value={cycle.id}>
              {cycle.name} {cycle.isActive ? '(Activo)' : ''}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Grupo"
          value={filterGroupId ?? ''}
          onChange={(e) => handleGroupChange(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="none">Sin grupo</MenuItem>
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {LEVEL_LABELS[group.level] ?? group.level} {group.name}
            </MenuItem>
          ))}
        </TextField>
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
                          active={sortBy === 'lastName1'}
                          direction={sortBy === 'lastName1' ? sortDir : 'asc'}
                          onClick={() => handleSort('lastName1')}
                        >
                          Nombre
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'group'}
                          direction={sortBy === 'group' ? sortDir : 'asc'}
                          onClick={() => handleSort('group')}
                        >
                          Grupo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Ciclo</TableCell>
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
                          active={sortBy === 'totalDebt'}
                          direction={sortBy === 'totalDebt' ? sortDir : 'asc'}
                          onClick={() => handleSort('totalDebt')}
                        >
                          Deuda
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => {
                      const debt = Number(student.totalDebt);
                      const fullName = [student.firstName, student.lastName1, student.lastName2]
                        .filter(Boolean)
                        .join(' ');
                      const groupLabel = student.group
                        ? `${LEVEL_LABELS[student.group.level] ?? student.group.level} ${student.group.name}`
                        : 'Sin grupo';

                      return (
                        <TableRow key={student.id}>
                          <TableCell>{fullName}</TableCell>
                          <TableCell>{groupLabel}</TableCell>
                          <TableCell>{student.schoolCycle?.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={STATUS_LABELS[student.status] ?? student.status}
                              color={STATUS_COLORS[student.status] ?? 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ color: debt > 0 ? 'error.main' : 'success.main' }}>
                            ${debt.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Ver detalle">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/alumnos/${student.id}`)}
                                color="primary"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {students.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 4 }}>
                          {debouncedSearch || filterStatus || filterGroupId !== undefined
                            ? 'No se encontraron alumnos con los filtros aplicados'
                            : 'No hay alumnos registrados'}
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
    </Box>
  );
}
