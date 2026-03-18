import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#29B6F6',
      light: '#4FC3F7',
      dark: '#0288D1',
    },
    secondary: {
      main: '#78909C',
      light: '#90A4AE',
      dark: '#546E7A',
    },
    background: {
      default: '#0B0F1A',
      paper: '#111827',
    },
    text: {
      primary: '#E2E8F0',
      secondary: '#94A3B8',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
    error: {
      main: '#EF5350',
    },
    warning: {
      main: '#FFA726',
    },
    success: {
      main: '#66BB6A',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#29B6F6',
      textWrap: 'balance',
    },
    h5: {
      fontWeight: 600,
      color: '#29B6F6',
      textWrap: 'balance',
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      textWrap: 'pretty',
    },
    body2: {
      textWrap: 'pretty',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          transitionProperty: 'background-color, color, scale',
          transitionDuration: '150ms',
          '&:active': {
            scale: '0.96',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transitionProperty: 'background-color, color, scale',
          transitionDuration: '150ms',
          '&:active': {
            scale: '0.96',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111827',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
          border: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontVariantNumeric: 'tabular-nums',
          borderBottomColor: 'rgba(148, 163, 184, 0.08)',
        },
        head: {
          fontWeight: 600,
          color: '#94A3B8',
          backgroundColor: '#0F1629',
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          '&:hover': {
            color: '#29B6F6',
          },
          '&.Mui-active': {
            color: '#29B6F6',
            '& .MuiTableSortLabel-icon': {
              color: '#29B6F6',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1A2236',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.3)',
          border: 'none',
          // Outer radius 12 = inner content radius 8 + ~4px padding
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(15, 22, 41, 0.6)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#111827',
          boxShadow: '1px 0 8px rgba(0,0,0,0.3)',
          borderRight: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transitionProperty: 'background-color',
          transitionDuration: '150ms',
          '&.Mui-selected': {
            backgroundColor: 'rgba(41, 182, 246, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(41, 182, 246, 0.18)',
            },
          },
        },
      },
    },
  },
});

export default theme;
