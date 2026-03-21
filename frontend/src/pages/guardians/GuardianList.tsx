import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useGuardians } from '@/hooks/useGuardians';

type SortKey = 'firstName' | 'lastName1' | 'phone' | 'email';
type SortDir = 'asc' | 'desc';

export default function GuardianList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('lastName1');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: response, isLoading } = useGuardians(
    page + 1,
    20,
    debouncedSearch || undefined,
    filterStatus || undefined,
    sortBy,
    sortDir,
  );

  const guardians = response?.data ?? [];
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

  // Computed status: active if has at least one student with status 'active'
  const isGuardianActive = (guardian: (typeof guardians)[0]) =>
    guardian.students?.some((link) => link.student.status === 'active');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tutores</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="ej. María García"
          label="Buscar tutor"
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
                          active={sortBy === 'phone'}
                          direction={sortBy === 'phone' ? sortDir : 'asc'}
                          onClick={() => handleSort('phone')}
                        >
                          Teléfono
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'email'}
                          direction={sortBy === 'email' ? sortDir : 'asc'}
                          onClick={() => handleSort('email')}
                        >
                          Correo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Alumnos</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {guardians.map((guardian) => {
                      const fullName = [guardian.firstName, guardian.lastName1, guardian.lastName2]
                        .filter(Boolean)
                        .join(' ');
                      const studentCount = guardian.students?.length ?? 0;
                      const active = isGuardianActive(guardian);

                      return (
                        <TableRow key={guardian.id}>
                          <TableCell>{fullName}</TableCell>
                          <TableCell>{guardian.phone}</TableCell>
                          <TableCell>{guardian.email ?? '—'}</TableCell>
                          <TableCell>{studentCount}</TableCell>
                          <TableCell>
                            <Chip
                              label={active ? 'Activo' : 'Inactivo'}
                              color={active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Ver detalle">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/tutores/${guardian.id}`)}
                                color="primary"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {guardians.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 4 }}>
                          {debouncedSearch || filterStatus
                            ? 'No se encontraron tutores con los filtros aplicados'
                            : 'No hay tutores registrados'}
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
