import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  People,
  Groups,
  PersonRemove,
  Payment,
  Receipt,
  Checkroom,
  Settings,
  CalendarMonth,
  Category,
  Autorenew,
  Inventory,
  CreditCard,
  ExpandLess,
  ExpandMore,
  School,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Matrícula',
    items: [
      { label: 'Alumnos', path: '/alumnos', icon: <People /> },
      { label: 'Grupos', path: '/grupos', icon: <Groups /> },
      { label: 'Bajas', path: '/bajas', icon: <PersonRemove /> },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { label: 'Pagos', path: '/pagos', icon: <Payment /> },
      { label: 'Historial de Pagos', path: '/pagos/historial', icon: <Receipt /> },
      { label: 'Uniformes', path: '/uniformes', icon: <Checkroom /> },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { label: 'Ciclos Escolares', path: '/configuracion/ciclos', icon: <CalendarMonth /> },
      { label: 'Conceptos de Pago', path: '/configuracion/conceptos', icon: <Category /> },
      { label: 'Pagos Recurrentes', path: '/configuracion/pagos-recurrentes', icon: <Autorenew /> },
      { label: 'Catálogo Uniformes', path: '/configuracion/catalogo-uniformes', icon: <Inventory /> },
      { label: 'Métodos de Pago', path: '/configuracion/metodos-pago', icon: <CreditCard /> },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Matrícula: true,
    Finanzas: true,
    Configuración: false,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: 'none',
          boxShadow: '1px 0 3px rgba(0,0,0,0.05), 2px 0 8px rgba(0,0,0,0.03)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          minHeight: 64,
        }}
        onClick={() => navigate('/')}
      >
        <School sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.2, fontSize: '1.1rem' }}>
            Colegio Alas
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gestión Escolar
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List component="nav" sx={{ px: 1, pt: 1 }}>
        {/* Home / Dashboard */}
        <ListItemButton
          selected={isActive('/')}
          onClick={() => navigate('/')}
          sx={{ borderRadius: 1, mb: 0.5, minHeight: 40 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Dashboard />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {/* Sections */}
        {navSections.map((section) => (
          <Box key={section.title} sx={{ mt: 0.5 }}>
            <ListItemButton
              onClick={() => toggleSection(section.title)}
              sx={{ borderRadius: 1, minHeight: 40 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Settings sx={{ fontSize: 20, color: 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
              />
              {openSections[section.title] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.items.map((item) => (
                  <ListItemButton
                    key={item.path}
                    selected={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    sx={{ pl: 4, borderRadius: 1, mb: 0.25, minHeight: 40 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
