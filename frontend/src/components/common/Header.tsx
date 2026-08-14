import { Link as RouterLink } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useAppSelector } from '../../store/hooks'

export default function Header() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const isSeller = user?.roles.some((role) => ['Seller', 'Moderator', 'Admin'].includes(role))

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(8, 13, 18, 0.84)', color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(18px)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ gap: 1.5, py: 1 }}>
          <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'text.primary', mr: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#07100b', boxShadow: '0 12px 26px rgba(101,212,110,0.22)' }}>
              <StorefrontIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontWeight={800}>VaultTrade</Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          <Button component={RouterLink} to="/catalog" color="inherit">
            Каталог
          </Button>

          {isAuthenticated && isSeller && (
            <>
              <Button component={RouterLink} to="/my-listings" color="inherit">
                Мои товары
              </Button>
              <Button component={RouterLink} to="/my-listings/create" variant="contained" startIcon={<AddCircleOutlineIcon />}>
                Создать
              </Button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Button component={RouterLink} to="/login" color="inherit">Вход</Button>
              <Button component={RouterLink} to="/register" variant="contained">Регистрация</Button>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  )
}
