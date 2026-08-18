import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#65d46e', light: '#9af2a1', dark: '#31a94a' },
    secondary: { main: '#44b9ff' },
    success: { main: '#47d764' },
    warning: { main: '#f4c14f' },
    error: { main: '#ff5d6c' },
    background: { default: '#080d12', paper: '#111922' },
    text: { primary: '#eef7f0', secondary: '#8fa0ad' },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 750 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#080d12',
        },
        'input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, textarea:-webkit-autofill, textarea:-webkit-autofill:hover, textarea:-webkit-autofill:focus': {
          WebkitBoxShadow: '0 0 0 100px #1b2a36 inset',
          WebkitTextFillColor: '#eef7f0',
          caretColor: '#eef7f0',
          borderRadius: 8,
          transition: 'background-color 9999s ease-out 0s',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          minHeight: 40,
        },
        contained: {
          color: '#07100b',
          backgroundImage: 'linear-gradient(135deg, #78ea85, #36c858)',
          '&:hover': {
            boxShadow: '0 12px 30px rgba(71, 215, 100, 0.22)',
          },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.13)',
          backgroundColor: 'rgba(255,255,255,0.03)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255,255,255,0.08)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))',
          boxShadow: '0 16px 50px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))',
          borderColor: 'rgba(255,255,255,0.08)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#19232d',
          borderRadius: 8,
          '&:hover': {
            backgroundColor: '#1d2a35',
          },
          '&.Mui-focused': {
            backgroundColor: '#203141',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(255,255,255,0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          fontWeight: 650,
        },
      },
    },
  },
})
