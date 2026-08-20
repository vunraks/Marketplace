import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Select,
  Stack,
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
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchProfile, logout } from '../../store/authSlice'
import { onNotificationReceived } from '../../realtime/notificationHub'
import { useUnreadNotifications } from '../../realtime/useUnreadNotifications'
import { useTranslation } from '../../i18n/LanguageProvider'
import type { LanguageCode } from '../../i18n/translations'
import { commerceApi } from '../../api/commerceApi'
import type { NotificationItem } from '../../types'
import { formatDateTime } from '../../utils/format'

function playMessageNotificationSound() {
  try {
    const audio = new Audio('/sounds/1111.mp3')
    audio.volume = 0.30
    void audio.play()
  } catch {
    // Browser may block audio until the user interacts with the page.
  }
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, profile } = useAppSelector((s) => s.auth)
  const { language, setLanguage, t, languageLabels, supportedLanguages } = useTranslation()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [toast, setToast] = useState<NotificationItem | null>(null)
  const unreadCount = useUnreadNotifications()

  const isSeller = user?.roles.some((role) => ['Seller', 'Moderator', 'Admin'].includes(role))
  const isModerator = user?.roles.some((role) => ['Moderator', 'Admin'].includes(role))
  const isAdmin = user?.roles.includes('Admin')
  const balance = profile?.virtualBalance ?? user?.virtualBalance ?? 0
  const isChatsPage = location.pathname.startsWith('/chats')
  const isRestricted = Boolean(profile?.isBlocked && (!profile.blockedUntil || new Date(profile.blockedUntil) > new Date()))

  useEffect(() => {
    if (!isAuthenticated) return

    return onNotificationReceived((notification) => {
      const isChatNotification = notification.type === 'message' || notification.type === 'chat_opened'

      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 30))
      if (!isChatsPage || !isChatNotification) {
        setToast(notification)
      }
      if (isChatNotification && !isChatsPage) {
        playMessageNotificationSound()
      }

      if (
        notification.type === 'promo_bonus' ||
        notification.type === 'wallet_adjusted' ||
        notification.type === 'order_completed' ||
        notification.type === 'dispute_resolved'
      ) {
        void dispatch(fetchProfile())
      }
    })
  }, [dispatch, isAuthenticated, isChatsPage])

  const closeMenu = () => setAnchor(null)
  const closeNotifications = () => setNotificationAnchor(null)

  const loadNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const { data } = await commerceApi.getNotifications()
      setNotifications(data.items)
    } catch {
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  const openNotifications = (element: HTMLElement) => {
    setNotificationAnchor(element)
    void loadNotifications()
    if (unreadCount > 0) {
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
      void commerceApi.markNotificationsRead()
    }
  }

  const signOut = () => {
    dispatch(logout())
    closeMenu()
    navigate('/')
  }

  return (
    <>
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
            {t('catalog')}
          </Button>

          {isAuthenticated && isSeller && !isRestricted && (
            <>
              <Button component={RouterLink} to="/my-listings" color="inherit">
                {t('myListings')}
              </Button>
              <Button component={RouterLink} to="/my-listings/create" variant="contained" startIcon={<AddCircleOutlineIcon />}>
                {t('create')}
              </Button>
            </>
          )}

          <Select
            size="small"
            value={language}
            onChange={(event) => setLanguage(event.target.value as LanguageCode)}
            aria-label={t('language')}
            sx={{
              minWidth: 84,
              height: 40,
              color: 'text.primary',
              '.MuiSelect-select': { py: 0.75, fontWeight: 800 },
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.14)' },
            }}
          >
            {supportedLanguages.map((code) => (
              <MenuItem key={code} value={code}>
                {code.toUpperCase()}
              </MenuItem>
            ))}
          </Select>

          {isAuthenticated ? (
            <>
              <Chip
                component={RouterLink}
                to="/profile"
                clickable
                label={`${balance.toLocaleString('ru-RU')} VT`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 800, textDecoration: 'none' }}
              />
              <IconButton
                onClick={(event) => openNotifications(event.currentTarget)}
                sx={{
                  width: 42,
                  height: 42,
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 2,
                  bgcolor: unreadCount > 0 ? 'rgba(244,193,79,0.1)' : 'rgba(255,255,255,0.03)',
                  transition: 'transform 0.18s ease, border-color 0.18s ease, background 0.18s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    borderColor: unreadCount > 0 ? 'warning.main' : 'primary.main',
                  },
                }}
              >
                <Badge badgeContent={unreadCount} color="warning" max={99}>
                  <NotificationsNoneIcon />
                </Badge>
              </IconButton>
              <IconButton onClick={(event) => setAnchor(event.currentTarget)}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(101,212,110,0.16)', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)', fontSize: 14, fontWeight: 900 }}>
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchor} open={!!anchor} onClose={closeMenu}>
                <MenuItem component={RouterLink} to="/profile" onClick={closeMenu}>
                  <PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} /> {t('profile')}
                </MenuItem>
                {isSeller && !isRestricted && (
                  <MenuItem component={RouterLink} to="/seller-dashboard" onClick={closeMenu}>
                    <DashboardOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> {t('sellerDashboard')}
                  </MenuItem>
                )}
                {!isSeller && !isRestricted && (
                  <MenuItem component={RouterLink} to="/become-seller" onClick={closeMenu}>
                    <WorkspacePremiumOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> {t('becomeSeller')}
                  </MenuItem>
                )}
                {!isRestricted && (
                  <MenuItem component={RouterLink} to="/chats" onClick={closeMenu}>
                    <ChatBubbleOutlineIcon fontSize="small" sx={{ mr: 1 }} /> {t('chats')} {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </MenuItem>
                )}
                {!isRestricted && (
                  <MenuItem component={RouterLink} to="/favorites" onClick={closeMenu}>
                    <FavoriteBorderIcon fontSize="small" sx={{ mr: 1 }} /> {t('favorites')}
                  </MenuItem>
                )}
                {!isRestricted && (
                  <MenuItem component={RouterLink} to="/orders" onClick={closeMenu}>
                    <ReceiptLongOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> {t('orderHistory')}
                  </MenuItem>
                )}
                {!isRestricted && (
                  <MenuItem component={RouterLink} to="/disputes" onClick={closeMenu}>
                    <GavelOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> {t('disputes')}
                  </MenuItem>
                )}
                {isModerator && !isRestricted && (
                  <MenuItem component={RouterLink} to="/moderation" onClick={closeMenu}>
                    <ShieldOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> {t('moderation')}
                  </MenuItem>
                )}
                {isModerator && !isRestricted && (
                  <MenuItem component={RouterLink} to="/admin/users" onClick={closeMenu}>
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} /> {t('users')}
                  </MenuItem>
                )}
                {isAdmin && !isRestricted && (
                  <MenuItem component={RouterLink} to="/admin/promocodes" onClick={closeMenu}>
                    <LocalOfferOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> {t('promoCodes')}
                  </MenuItem>
                )}
                <MenuItem disabled sx={{ display: { xs: 'flex', sm: 'none' }, opacity: '1 !important' }}>
                  {languageLabels[language]}
                </MenuItem>
                <MenuItem onClick={signOut}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> {t('logout')}
                </MenuItem>
              </Menu>
              <Menu
                anchorEl={notificationAnchor}
                open={!!notificationAnchor}
                onClose={closeNotifications}
                PaperProps={{
                  sx: {
                    width: 360,
                    maxWidth: 'calc(100vw - 24px)',
                    mt: 1,
                    overflow: 'hidden',
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography fontWeight={900}>{t('notifications', 'Уведомления')}</Typography>
                    <Chip size="small" label={unreadCount > 0 ? unreadCount : t('all', 'Все')} color={unreadCount > 0 ? 'warning' : 'default'} />
                  </Stack>
                </Box>
                <Divider />
                <Box sx={{ maxHeight: 390, overflowY: 'auto', py: 0.5 }}>
                  {notificationsLoading ? (
                    <Box sx={{ px: 2, py: 2 }}>
                      <Typography color="text.secondary">{t('loading', 'Загрузка...')}</Typography>
                    </Box>
                  ) : notifications.length === 0 ? (
                    <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">{t('noNotifications', 'Пока нет уведомлений')}</Typography>
                    </Box>
                  ) : notifications.map((notification) => (
                    <MenuItem
                      key={notification.id}
                      component={RouterLink}
                      to="/chats"
                      onClick={closeNotifications}
                      sx={{
                        alignItems: 'flex-start',
                        gap: 1,
                        py: 1.25,
                        borderLeft: notification.isRead ? '3px solid transparent' : '3px solid',
                        borderLeftColor: notification.isRead ? 'transparent' : 'primary.main',
                      }}
                    >
                      <NotificationsNoneIcon color={notification.isRead ? 'disabled' : 'primary'} fontSize="small" sx={{ mt: 0.25 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} noWrap>{notification.title}</Typography>
                        {notification.body && (
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                            {notification.body}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">{formatDateTime(notification.createdAt)}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              </Menu>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login" color="inherit">{t('login')}</Button>
              <Button component={RouterLink} to="/register" variant="contained">{t('register')}</Button>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
    <Snackbar
      open={!!toast}
      autoHideDuration={5200}
      onClose={() => setToast(null)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 20,
        top: { xs: 76, sm: 84 },
        right: { xs: 12, sm: 28 },
        left: { xs: 12, sm: 'auto' },
      }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={() => setToast(null)}
        sx={{
          width: { xs: '100%', sm: 390 },
          maxWidth: '100%',
          bgcolor: '#182531',
          color: 'text.primary',
          border: '1px solid rgba(101,212,110,0.22)',
          boxShadow: '0 18px 60px rgba(0,0,0,0.42)',
          alignItems: 'flex-start',
        }}
      >
        <Typography fontWeight={800} sx={{ pr: 1 }}>{toast?.title}</Typography>
        {toast?.body && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{toast.body}</Typography>}
      </Alert>
    </Snackbar>
    </>
  )
}
