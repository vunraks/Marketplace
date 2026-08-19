import { useEffect, useState } from 'react'
import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { loginWithTelegramOidc } from '../store/authSlice'
import { consumeTelegramOidcSession, telegramOidcRedirectUri } from '../utils/telegramOidc'

export default function TelegramCallbackPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const completeLogin = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const telegramError = searchParams.get('error')

        if (telegramError) throw new Error(telegramError)
        if (!code) throw new Error('Telegram не вернул code')

        const codeVerifier = consumeTelegramOidcSession(state)
        const result = await dispatch(loginWithTelegramOidc({
          code,
          redirectUri: telegramOidcRedirectUri(),
          codeVerifier,
        }))

        if (loginWithTelegramOidc.fulfilled.match(result)) {
          navigate('/', { replace: true })
          return
        }

        throw new Error(String(result.payload ?? 'Не удалось войти через Telegram'))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось войти через Telegram')
      }
    }

    void completeLogin()
  }, [dispatch, navigate, searchParams])

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
        Вход через Telegram
      </Typography>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box sx={{ display: 'grid', justifyItems: 'center', gap: 2, py: 4 }}>
          <CircularProgress />
          <Typography color="text.secondary">Завершаем авторизацию...</Typography>
        </Box>
      )}
    </Box>
  )
}
