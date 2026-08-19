import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, Box, Button, Divider, Link, Stack, TextField, Tooltip, Typography } from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import SendIcon from '@mui/icons-material/Send'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearError, loginWithGoogle, register as registerUser } from '../store/authSlice'
import { renderGoogleSignInButton } from '../utils/googleAuth'
import { startTelegramOidcLogin } from '../utils/telegramOidc'
import { useTranslation } from '../i18n/LanguageProvider'

type FormData = {
  email: string
  username: string
  password: string
  confirmPassword: string
}

const googleButtonWrapSx = {
  width: 54,
  height: 54,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '50%',
  p: 0,
  border: 0,
  background: 'transparent',
  overflow: 'hidden',
  boxShadow: '0 14px 26px rgba(0,0,0,0.18)',
  transition: 'transform 160ms ease, border-color 160ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
  '& > div': {
    width: '54px !important',
    height: '54px !important',
  },
  '& iframe': {
    width: '54px !important',
    height: '54px !important',
  },
}

const iconLoginButtonSx = {
  width: 58,
  height: 58,
  minWidth: 58,
  borderRadius: '50%',
  color: '#ffffff',
  borderColor: 'rgba(56, 189, 248, 0.42)',
  background: 'linear-gradient(145deg, #2aabee, #22c55e)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 14px 26px rgba(34, 197, 94, 0.18)',
  '&:hover': {
    borderColor: 'rgba(186, 230, 253, 0.82)',
    background: 'linear-gradient(145deg, #0ea5e9, #22c55e)',
    transform: 'translateY(-2px)',
  },
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [externalError, setExternalError] = useState('')
  const googleButtonRef = useRef<HTMLDivElement | null>(null)

  const schema = z.object({
    email: z.string().email(t('emailInvalid')),
    username: z.string().min(3, 'Minimum 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and _'),
    password: z.string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Use an uppercase letter')
      .regex(/[a-z]/, 'Use a lowercase letter')
      .regex(/[0-9]/, 'Use a number'),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    dispatch(clearError())
    const result = await dispatch(registerUser(data))
    if (registerUser.fulfilled.match(result)) navigate('/login')
  }

  const submitGoogleToken = async (idToken: string) => {
    dispatch(clearError())
    setExternalError('')
    try {
      const result = await dispatch(loginWithGoogle(idToken))
      if (loginWithGoogle.fulfilled.match(result)) navigate('/')
    } catch (e) {
      setExternalError(e instanceof Error ? e.message : 'Google sign-in failed')
    }
  }

  const startTelegramLogin = async () => {
    dispatch(clearError())
    setExternalError('')
    try {
      await startTelegramOidcLogin()
    } catch (e) {
      setExternalError(e instanceof Error ? e.message : 'Telegram sign-in failed')
    }
  }

  useEffect(() => {
    if (!googleButtonRef.current) return

    renderGoogleSignInButton(
      googleButtonRef.current,
      (idToken) => void submitGoogleToken(idToken),
      setExternalError,
      'signup_with',
      'icon',
    ).catch((e) => setExternalError(e instanceof Error ? e.message : 'Google sign-in failed'))
  }, [])

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>{t('registerTitle')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          {t('registerText')}
        </Typography>
      </Box>

      <Stack spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography fontWeight={800}>Быстрый вход</Typography>
          <Typography variant="body2" color="text.secondary">
            Выберите удобный сервис
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Tooltip title="Войти через Telegram">
            <Button variant="outlined" aria-label="Войти через Telegram" onClick={() => void startTelegramLogin()} sx={iconLoginButtonSx}>
              <SendIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Войти через Google">
            <Box ref={googleButtonRef} sx={googleButtonWrapSx} />
          </Tooltip>
        </Stack>
      </Stack>

      <Divider sx={{ my: 3 }}>{t('or')}</Divider>

      {(error || externalError) && <Alert severity="error" sx={{ mb: 2 }}>{error || externalError}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={1.75}>
          <TextField fullWidth label="Email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField fullWidth label={t('username')} autoComplete="username" {...register('username')} error={!!errors.username} helperText={errors.username?.message} />
          <TextField fullWidth label={t('password')} type="password" autoComplete="new-password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <TextField fullWidth label={t('repeatPassword')} type="password" autoComplete="new-password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<PersonAddAltIcon />} disabled={loading}>
            {loading ? t('creatingAccount') : t('createAccount')}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
        {t('alreadyHaveAccount')} <Link component={RouterLink} to="/login">{t('signIn')}</Link>
      </Typography>
    </>
  )
}
