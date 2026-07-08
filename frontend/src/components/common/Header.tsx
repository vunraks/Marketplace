import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  alpha,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import StorefrontIcon from '@mui/icons-material/Storefront'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout } from '../../store/authSlice'
import { commerceApi } from '../../api/commerceApi'

export default function Header() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [search, setSearch] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/catalog?q=${encodeURIComponent(search.trim())}`)
  }

  const isSeller = user?.roles.some((r) => ['Seller', 'Moderator', 'Admin'].includes(r))
  const isModerator = user?.roles.some((r) => ['Moderator', 'Admin'].includes(r))
  const isAdmin = user?.roles.includes('Admin')

  useEffect(() => {
    if (!isAuthenticated) return
    const load = () => commerceApi.getNotifications()
      .then((r) => setUnreadCount(r.data.unreadCount))
      .catch(() => undefined)
    load()
    const timer = window.setInterval(load, 10000)
    return () => window.clearInterval(timer)
  }, [isAuthenticated])

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

          <Box component="form" onSubmit={handleSearch} sx={{ flex: 1, maxWidth: 620, display: { xs: 'none', md: 'flex' }, alignItems: 'center', bgcolor: alpha('#ffffff', 0.055), border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, px: 1.5 }}>
            <SearchIcon color="primary" fontSize="small" />
            <InputBase placeholder="Поиск товаров, аккаунтов, ключей..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ ml: 1, flex: 1, py: 0.75 }} />
          </Box>

          <Button component={RouterLink} to="/catalog" color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Каталог</Button>

          {isAuthenticated ? (
            <>
              {isSeller && (
                <Button component={RouterLink} to="/my-listings" color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  Мои товары
                </Button>
              )}
              {isModerator && (
                <Button component={RouterLink} to="/moderation" color="inherit" startIcon={<ShieldOutlinedIcon />} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                  Модерация
                </Button>
              )}
              {isAdmin && (
                <Button component={RouterLink} to="/admin/users" color="inherit" startIcon={<AdminPanelSettingsIcon />} sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>
                  Пользователи
                </Button>
              )}
              {isSeller && (
                <Button component={RouterLink} to="/my-listings/create" variant="contained" startIcon={<AddCircleOutlineIcon />} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                  Создать
                </Button>
              )}
              <Button component={RouterLink} to="/chats" color="inherit" startIcon={<ChatBubbleOutlineIcon />} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                Чаты
              </Button>
              {user?.virtualBalance != null && (
                <Chip label={`${user.virtualBalance.toLocaleString('ru-RU')} VT`} color="primary" variant="outlined" sx={{ display: { xs: 'none', lg: 'inline-flex' } }} />
              )}
              <Chip icon={<NotificationsNoneIcon />} label={unreadCount} color={unreadCount > 0 ? 'warning' : 'default'} variant="outlined" />
              <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(101,212,110,0.16)', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)', fontSize: 14, fontWeight: 800 }}>
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
                <MenuItem component={RouterLink} to="/profile" onClick={() => setAnchor(null)}>Профиль</MenuItem>
                <MenuItem component={RouterLink} to="/chats" onClick={() => setAnchor(null)}>Чаты {unreadCount > 0 ? `(${unreadCount})` : ''}</MenuItem>
                {!isSeller && (
                  <MenuItem component={RouterLink} to="/become-seller" onClick={() => setAnchor(null)}>Стать продавцом</MenuItem>
                )}
                {isSeller && (
                  <MenuItem component={RouterLink} to="/my-listings/create" onClick={() => setAnchor(null)}>Создать объявление</MenuItem>
                )}
                {isModerator && (
                  <MenuItem component={RouterLink} to="/moderation" onClick={() => setAnchor(null)}>Модерация</MenuItem>
                )}
                {isAdmin && (
                  <MenuItem component={RouterLink} to="/admin/users" onClick={() => setAnchor(null)}>Пользователи</MenuItem>
                )}
                <MenuItem onClick={() => { dispatch(logout()); setAnchor(null); navigate('/') }}>Выйти</MenuItem>
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
