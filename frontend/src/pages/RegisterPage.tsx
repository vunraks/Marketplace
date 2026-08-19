import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Typography, TextField, Button, Alert, Link, Stack, Divider, Box } from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
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

const socialButtonSx = {
  height: 54,
  borderRadius: 2,
  justifyContent: 'center',
  fontWeight: 800,
  textTransform: 'none',
  borderColor: 'rgba(148, 163, 184, 0.24)',
  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.86))',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 28px rgba(0,0,0,0.18)',
  '&:hover': {
    borderColor: 'rgba(96, 165, 250, 0.46)',
    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(15, 23, 42, 0.92))',
    transform: 'translateY(-1px)',
  },
}

const googleButtonWrapSx = {
  minHeight: 54,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 2,
  p: 0,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: 'rgba(2, 6, 23, 0.28)',
  overflow: 'hidden',
  '& > div': {
    width: '100% !important',
  },
  '& iframe': {
    width: '100% !important',
  },
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [googleError, setGoogleError] = useState('')
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
    setGoogleError('')
    try {
      const result = await dispatch(loginWithGoogle(idToken))
      if (loginWithGoogle.fulfilled.match(result)) navigate('/')
    } catch (e) {
      setGoogleError(e instanceof Error ? e.message : 'Google sign-in failed')
    }
  }

  useEffect(() => {
    if (!googleButtonRef.current) return

    renderGoogleSignInButton(
      googleButtonRef.current,
      (idToken) => void submitGoogleToken(idToken),
      setGoogleError,
      'signup_with',
    ).catch((e) => setGoogleError(e instanceof Error ? e.message : 'Google sign-in failed'))
  }, [])

  const startTelegramLogin = async () => {
    dispatch(clearError())
    setGoogleError('')
    try {
      await startTelegramOidcLogin()
    } catch (e) {
      setGoogleError(e instanceof Error ? e.message : 'Telegram sign-in failed')
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>{t('registerTitle')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          {t('registerText')}
        </Typography>
      </Box>

      <Stack spacing={1.25}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<SendIcon />}
          onClick={() => void startTelegramLogin()}
          sx={{
            ...socialButtonSx,
            color: '#e8f7ff',
            borderColor: 'rgba(56, 189, 248, 0.42)',
            background: 'linear-gradient(135deg, rgba(42, 171, 238, 0.95), rgba(34, 197, 94, 0.82))',
            '&:hover': {
              borderColor: 'rgba(186, 230, 253, 0.82)',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 1), rgba(34, 197, 94, 0.95))',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Войти через Telegram
        </Button>
        <Box ref={googleButtonRef} sx={googleButtonWrapSx} />
        <Button
          variant="outlined"
          size="large"
          startIcon={<SportsEsportsIcon />}
          disabled
          sx={{
            ...socialButtonSx,
            color: 'rgba(226, 232, 240, 0.62)',
            '&.Mui-disabled': {
              color: 'rgba(226, 232, 240, 0.46)',
              borderColor: 'rgba(148, 163, 184, 0.18)',
              background: 'rgba(15, 23, 42, 0.42)',
            },
          }}
        >
          {t('continueSteam')}
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }}>{t('or')}</Divider>

      {(error || googleError) && <Alert severity="error" sx={{ mb: 2 }}>{error || googleError}</Alert>}
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
