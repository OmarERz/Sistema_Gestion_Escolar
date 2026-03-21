import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  Button,
  IconButton,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
} from '@mui/material';
import { Add, Delete, CheckCircle, Edit } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import NumberField from '@/components/common/NumberField';
import { useStudents } from '@/hooks/useStudents';
import {
  useUniformCatalog,
  useUniformOrders,
  useCreateUniformOrder,
  useUpdateUniform,
  useMarkDelivered,
  useDeleteUniform,
} from '@/hooks/useUniforms';
import type { Student } from '@/types/student';
import type { Uniform } from '@/types/uniform';

const SIZE_OPTIONS = ['XCH', 'CH', 'M', 'G', 'XG', '4', '6', '8', '10', '12', '14', '16'];

type OrderSortKey = 'orderDate' | 'totalPrice' | 'isDelivered' | 'student' | 'catalogItem';
type SortDir = 'asc' | 'desc';

interface OrderItem {
  uniformCatalogId: number;
  catalogName: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export default function UniformRegistration() {
  // ----- Form state -----
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // ----- Orders table state -----
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<OrderSortKey>('orderDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [searchFilter, setSearchFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');

  // ----- Confirm dialogs -----
  const [confirmDeliverId, setConfirmDeliverId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // ----- Edit dialog -----
  const [editingOrder, setEditingOrder] = useState<Uniform | null>(null);
  const [editSize, setEditSize] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');

  const { enqueueSnackbar } = useSnackbar();

  // Data queries
  const { data: studentsRes } = useStudents(1, 10, studentSearch || undefined, 'active');
  const students = studentsRes?.data ?? [];

  const { data: catalogRes } = useUniformCatalog(1, 100, 'name', 'asc', { isActive: 'true' });
  const catalogItems = catalogRes?.data ?? [];

  const ordersFilters = {
    search: searchFilter || undefined,
    isDelivered: deliveryFilter || undefined,
  };
  const { data: ordersRes, isLoading: loadingOrders } = useUniformOrders(
    page + 1, 20, sortBy, sortDir, ordersFilters,
  );
  const orders = ordersRes?.data ?? [];
  const totalOrders = ordersRes?.pagination?.total ?? 0;

  // Mutations
  const createOrderMutation = useCreateUniformOrder();
  const updateUniformMutation = useUpdateUniform();
  const markDeliveredMutation = useMarkDelivered();
  const deleteMutation = useDeleteUniform();

  // ----- Form handlers -----

  const addItem = () => {
    setOrderItems([...orderItems, {
      uniformCatalogId: 0,
      catalogName: '',
      size: '',
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const updateItem = (index: number, updates: Partial<OrderItem>) => {
    setOrderItems(orderItems.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const orderTotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!selectedStudent) {
      setFormError('Selecciona un alumno');
      return;
    }
    if (orderItems.length === 0) {
      setFormError('Agrega al menos un artículo');
      return;
    }

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.uniformCatalogId) {
        setFormError(`Artículo ${i + 1}: selecciona un artículo del catálogo`);
        return;
      }
      if (!item.size.trim()) {
        setFormError(`Artículo ${i + 1}: selecciona una talla`);
        return;
      }
      if (item.quantity < 1) {
        setFormError(`Artículo ${i + 1}: la cantidad debe ser al menos 1`);
        return;
      }
    }

    setFormError('');

    try {
      await createOrderMutation.mutateAsync({
        studentId: selectedStudent.id,
        orderDate,
        notes: notes || null,
        items: orderItems.map(({ uniformCatalogId, size, quantity }) => ({
          uniformCatalogId,
          size,
          quantity,
        })),
      });
      enqueueSnackbar('Pedido registrado', { variant: 'success' });
      setOrderItems([]);
      setNotes('');
      setFormError('');
    } catch {
      setFormError('Error al registrar el pedido');
    }
  };

  // ----- Table handlers -----

  const handleSort = (key: OrderSortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleMarkDelivered = async () => {
    if (!confirmDeliverId) return;
    try {
      await markDeliveredMutation.mutateAsync(confirmDeliverId);
      enqueueSnackbar('Artículo marcado como entregado', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al marcar como entregado', { variant: 'error' });
    }
    setConfirmDeliverId(null);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      enqueueSnackbar('Artículo eliminado', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al eliminar', { variant: 'error' });
    }
    setConfirmDeleteId(null);
  };

  // ----- Edit handlers -----

  const openEditDialog = (order: Uniform) => {
    setEditingOrder(order);
    setEditSize(order.size);
    setEditQuantity(order.quantity);
    setEditNotes(order.notes ?? '');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    if (!editSize.trim()) {
      setEditError('La talla es requerida');
      return;
    }
    if (editQuantity < 1) {
      setEditError('La cantidad debe ser al menos 1');
      return;
    }

    try {
      await updateUniformMutation.mutateAsync({
        id: editingOrder.id,
        input: {
          size: editSize,
          quantity: editQuantity,
          notes: editNotes || null,
        },
      });
      enqueueSnackbar('Pedido actualizado', { variant: 'success' });
      setEditingOrder(null);
    } catch {
      setEditError('Error al actualizar el pedido');
    }
  };

  const formatCurrency = (amount: number | string) =>
    Number(amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const formatStudentName = (s: { firstName: string; lastName1: string; lastName2?: string | null }) =>
    [s.firstName, s.lastName1, s.lastName2].filter(Boolean).join(' ');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Registro de Uniformes</Typography>

      {/* ====== Order Form ====== */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Nuevo Pedido</Typography>

          {/* Student search */}
          <Autocomplete
            options={students}
            getOptionLabel={(o) => formatStudentName(o)}
            value={selectedStudent}
            onChange={(_, value) => setSelectedStudent(value)}
            onInputChange={(_, value) => setStudentSearch(value)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2">{formatStudentName(option)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.group?.name ?? 'Sin grupo'}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Alumno" placeholder="ej. García López" fullWidth />
            )}
            noOptionsText="No se encontraron alumnos"
            isOptionEqualToValue={(a, b) => a.id === b.id}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Fecha de Pedido"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
            <TextField
              label="Notas"
              placeholder="ej. Entrega para septiembre"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Items list */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">Artículos</Typography>
            <Button size="small" startIcon={<Add />} onClick={addItem}>
              Agregar Artículo
            </Button>
          </Box>

          {orderItems.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Agrega artículos al pedido usando el botón "Agregar Artículo"
            </Alert>
          ) : (
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Artículo</TableCell>
                    <TableCell>Talla</TableCell>
                    <TableCell sx={{ width: 100 }}>Cantidad</TableCell>
                    <TableCell>Precio Unit.</TableCell>
                    <TableCell>Subtotal</TableCell>
                    <TableCell sx={{ width: 50 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={item.uniformCatalogId || ''}
                          onChange={(e) => {
                            const catId = parseInt(e.target.value, 10);
                            const catalog = catalogItems.find(c => c.id === catId);
                            updateItem(index, {
                              uniformCatalogId: catId,
                              catalogName: catalog?.name ?? '',
                              unitPrice: catalog ? Number(catalog.basePrice) : 0,
                            });
                          }}
                          placeholder="Seleccionar"
                        >
                          {catalogItems.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name} — {formatCurrency(c.basePrice)}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          freeSolo
                          options={SIZE_OPTIONS}
                          value={item.size}
                          onChange={(_, value) => updateItem(index, { size: value ?? '' })}
                          onInputChange={(_, value) => updateItem(index, { size: value })}
                          renderInput={(params) => (
                            <TextField {...params} size="small" placeholder="ej. M" />
                          )}
                          sx={{ minWidth: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        <NumberField
                          size="small"
                          value={item.quantity}
                          onValueChange={(v) => updateItem(index, { quantity: parseInt(v, 10) || 1 })}
                          min={1}
                          step={1}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => removeItem(index)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Total: {formatCurrency(orderTotal)}
            </Typography>
            <Button
              variant="contained"
              onClick={handleSubmitOrder}
              disabled={createOrderMutation.isPending || orderItems.length === 0}
            >
              {createOrderMutation.isPending ? 'Registrando...' : 'Registrar Pedido'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ====== Orders Table ====== */}
      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Pedidos Registrados</Typography>

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
              label="Entrega"
              value={deliveryFilter}
              onChange={(e) => { setDeliveryFilter(e.target.value); setPage(0); }}
              size="small"
              sx={{ width: 180 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="false">Pendiente</MenuItem>
              <MenuItem value="true">Entregado</MenuItem>
            </TextField>
          </Box>

          {loadingOrders ? (
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
                          active={sortBy === 'catalogItem'}
                          direction={sortBy === 'catalogItem' ? sortDir : 'asc'}
                          onClick={() => handleSort('catalogItem')}
                        >
                          Artículo
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Talla</TableCell>
                      <TableCell>Cant.</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'totalPrice'}
                          direction={sortBy === 'totalPrice' ? sortDir : 'asc'}
                          onClick={() => handleSort('totalPrice')}
                        >
                          Total
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'orderDate'}
                          direction={sortBy === 'orderDate' ? sortDir : 'asc'}
                          onClick={() => handleSort('orderDate')}
                        >
                          Fecha Pedido
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Notas</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={sortBy === 'isDelivered'}
                          direction={sortBy === 'isDelivered' ? sortDir : 'asc'}
                          onClick={() => handleSort('isDelivered')}
                        >
                          Entrega
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order: Uniform) => (
                      <TableRow key={order.id}>
                        <TableCell>{formatStudentName(order.student)}</TableCell>
                        <TableCell>{order.uniformCatalog.name}</TableCell>
                        <TableCell>{order.size}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                        <TableCell>{new Date(order.orderDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>
                          {order.notes ? (
                            <Tooltip title={order.notes} arrow>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 150,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  cursor: 'default',
                                }}
                              >
                                {order.notes}
                              </Typography>
                            </Tooltip>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.isDelivered ? 'Entregado' : 'Pendiente'}
                            color={order.isDelivered ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(order)}
                            title="Editar"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {!order.isDelivered && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setConfirmDeliverId(order.id)}
                              title="Marcar Entregado"
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmDeleteId(order.id)}
                            title="Eliminar"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ py: 4 }}>
                          No hay pedidos registrados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalOrders}
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

      {/* Edit order dialog */}
      <Dialog open={editingOrder !== null} onClose={() => setEditingOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Pedido</DialogTitle>
        <DialogContent>
          {editingOrder && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Artículo: <strong>{editingOrder.uniformCatalog.name}</strong> — Precio unit.: {formatCurrency(editingOrder.unitPrice)}
              </Typography>
              {editError && (
                <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>
              )}
              <Autocomplete
                freeSolo
                options={SIZE_OPTIONS}
                value={editSize}
                onChange={(_, value) => setEditSize(value ?? '')}
                onInputChange={(_, value) => setEditSize(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Talla" placeholder="ej. M" margin="normal" fullWidth />
                )}
              />
              <NumberField
                fullWidth
                label="Cantidad"
                value={editQuantity}
                onValueChange={(v) => setEditQuantity(parseInt(v, 10) || 1)}
                margin="normal"
                min={1}
                step={1}
              />
              <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                Nuevo total: <strong>{formatCurrency(Number(editingOrder.unitPrice) * editQuantity)}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Notas"
                placeholder="ej. Entrega para septiembre"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingOrder(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={updateUniformMutation.isPending}
          >
            {updateUniformMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm deliver dialog */}
      <Dialog open={confirmDeliverId !== null} onClose={() => setConfirmDeliverId(null)}>
        <DialogTitle>Confirmar Entrega</DialogTitle>
        <DialogContent>
          <Typography>¿Marcar este artículo como entregado?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeliverId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleMarkDelivered}
            disabled={markDeliveredMutation.isPending}
          >
            {markDeliveredMutation.isPending ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar este artículo del pedido? Esta acción no se puede deshacer.</Typography>
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
