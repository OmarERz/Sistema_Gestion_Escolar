import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { DRAWER_WIDTH } from './Sidebar';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {user?.fullName}
        </Typography>
        <IconButton
          onClick={logout}
          size="small"
          title="Cerrar sesión"
          sx={{ minWidth: 40, minHeight: 40 }}
        >
          <Logout fontSize="small" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
