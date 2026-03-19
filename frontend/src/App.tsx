import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';
import theme from '@/styles/theme';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import StudentList from '@/pages/students/StudentList';
import StudentCreate from '@/pages/students/StudentCreate';
import StudentDetail from '@/pages/students/StudentDetail';
import GroupList from '@/pages/groups/GroupList';
import PaymentForm from '@/pages/payments/PaymentForm';
import PaymentHistory from '@/pages/payments/PaymentHistory';
import UniformRegistration from '@/pages/uniforms/UniformRegistration';
import WithdrawalHistory from '@/pages/withdrawals/WithdrawalHistory';
import WithdrawalForm from '@/pages/withdrawals/WithdrawalForm';
import SchoolCycleManagement from '@/pages/settings/SchoolCycleManagement';
import PaymentConceptManagement from '@/pages/settings/PaymentConceptManagement';
import RecurringRulesManagement from '@/pages/settings/RecurringRulesManagement';
import UniformCatalog from '@/pages/settings/UniformCatalog';
import PaymentMethodManagement from '@/pages/settings/PaymentMethodManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />

                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Home */}
                    <Route index element={<Dashboard />} />

                    {/* Matrícula */}
                    <Route path="alumnos" element={<StudentList />} />
                    <Route path="alumnos/nuevo" element={<StudentCreate />} />
                    <Route path="alumnos/:id" element={<StudentDetail />} />
                    <Route path="grupos" element={<GroupList />} />
                    <Route path="bajas" element={<WithdrawalHistory />} />
                    <Route path="bajas/nueva" element={<WithdrawalForm />} />

                    {/* Finanzas */}
                    <Route path="pagos" element={<PaymentForm />} />
                    <Route path="pagos/historial" element={<PaymentHistory />} />
                    <Route path="uniformes" element={<UniformRegistration />} />

                    {/* Configuración */}
                    <Route path="configuracion/ciclos" element={<SchoolCycleManagement />} />
                    <Route path="configuracion/conceptos" element={<PaymentConceptManagement />} />
                    <Route path="configuracion/pagos-recurrentes" element={<RecurringRulesManagement />} />
                    <Route path="configuracion/catalogo-uniformes" element={<UniformCatalog />} />
                    <Route path="configuracion/metodos-pago" element={<PaymentMethodManagement />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </SnackbarProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
