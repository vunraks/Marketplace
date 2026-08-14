import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { commerceApi } from '../../api/commerceApi'

export default function Header() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const isSeller = user?.roles.some((role) => ['Seller', 'Moderator', 'Admin'].includes(role))
  const isModerator = user?.roles.some((role) => ['Moderator', 'Admin'].includes(role))
  const isAdmin = user?.roles.includes('Admin')

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    const load = () => commerceApi.getNotifications()
      .then((response) => setUnreadCount(response.data.unreadCount))
      .catch(() => undefined)

    load()
    const timer = window.setInterval(load, 10000)
    return () => window.clearInterval(timer)
  }, [isAuthenticated])

  const closeMenu = () => setAnchor(null)

  const signOut = () => {
    dispatch(logout())
    closeMenu()
    navigate('/')
  }

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

          {isAuthenticated ? (
            <>
              <Chip
                icon={<NotificationsNoneIcon />}
                label={unreadCount}
                color={unreadCount > 0 ? 'warning' : 'default'}
                variant="outlined"
              />
              <IconButton onClick={(event) => setAnchor(event.currentTarget)}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(101,212,110,0.16)', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)', fontSize: 14, fontWeight: 900 }}>
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchor} open={!!anchor} onClose={closeMenu}>
                <MenuItem component={RouterLink} to="/profile" onClick={closeMenu}>
                  <PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Профиль
                </MenuItem>
                {isSeller && (
                  <MenuItem component={RouterLink} to="/seller-dashboard" onClick={closeMenu}>
                    <DashboardOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Кабинет продавца
                  </MenuItem>
                )}
                <MenuItem component={RouterLink} to="/chats" onClick={closeMenu}>
                  <ChatBubbleOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Чаты {unreadCount > 0 ? `(${unreadCount})` : ''}
                </MenuItem>
                <MenuItem component={RouterLink} to="/favorites" onClick={closeMenu}>
                  <FavoriteBorderIcon fontSize="small" sx={{ mr: 1 }} /> Избранное
                </MenuItem>
                <MenuItem component={RouterLink} to="/disputes" onClick={closeMenu}>
                  <GavelOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Споры
                </MenuItem>
                {isModerator && (
                  <MenuItem component={RouterLink} to="/moderation" onClick={closeMenu}>
                    <ShieldOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Модерация
                  </MenuItem>
                )}
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/admin/users" onClick={closeMenu}>
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} /> Пользователи
                  </MenuItem>
                )}
                <MenuItem onClick={signOut}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Выйти
                </MenuItem>
              </Menu>
            </>
          ) : (
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
