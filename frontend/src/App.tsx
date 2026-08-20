import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import AppRoutes from './routes/AppRoutes'
import { RealtimeBridge } from './realtime/RealtimeBridge'
import { fetchProfile, sessionExpired } from './store/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { AUTH_EXPIRED_EVENT } from './utils/storage'

export default function App() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, profile } = useAppSelector((s) => s.auth)
  const [restrictionNoticeOpen, setRestrictionNoticeOpen] = useState(false)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isRestricted = Boolean(profile?.isBlocked && (!profile.blockedUntil || new Date(profile.blockedUntil) > new Date()))

  useEffect(() => {
    if (isAuthenticated && !isAuthPage) {
      dispatch(fetchProfile())
    }
  }, [dispatch, isAuthenticated, isAuthPage])

  useEffect(() => {
    const handleExpired = () => {
      dispatch(sessionExpired())
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [dispatch])

  useEffect(() => {
    if (isRestricted) setRestrictionNoticeOpen(true)
  }, [isRestricted, profile?.blockedUntil, profile?.blockReason])

  return (
    <>
      <RealtimeBridge />
      <AppRoutes />
      <Dialog open={isRestricted && restrictionNoticeOpen} maxWidth="sm" fullWidth>
        <DialogTitle>Аккаунт ограничен</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="warning">
              Вам доступен только просмотр объявлений. Создание товаров, покупки, сообщения, споры, промокоды и изменение профиля временно недоступны.
            </Alert>
            <Typography>
              {profile?.blockedUntil
                ? `Ограничен до: ${new Date(profile.blockedUntil).toLocaleString('ru-RU')}`
                : 'Ограничение действует бессрочно.'}
            </Typography>
            {profile?.blockReason && (
              <Typography color="text.secondary">
                Причина: {profile.blockReason}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setRestrictionNoticeOpen(false)}>
            Понятно
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setRestrictionNoticeOpen(false)
              navigate('/catalog')
            }}
          >
            Смотреть каталог
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
