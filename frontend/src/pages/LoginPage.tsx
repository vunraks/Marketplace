import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Typography, TextField, Button, Alert, Link, Stack, Divider, Box } from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import LoginIcon from '@mui/icons-material/Login'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearError, login, loginWithGoogle } from '../store/authSlice'
import { renderGoogleSignInButton } from '../utils/googleAuth'
import { useTranslation } from '../i18n/LanguageProvider'

type FormData = {
  email: string
  password: string
}

export default function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [googleError, setGoogleError] = useState('')
  const googleButtonRef = useRef<HTMLDivElement | null>(null)

  const schema = z.object({
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(1, t('passwordRequired')),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    dispatch(clearError())
    const result = await dispatch(login(data))
    if (login.fulfilled.match(result)) navigate('/')
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
      'signin_with',
    ).catch((e) => setGoogleError(e instanceof Error ? e.message : 'Google sign-in failed'))
  }, [])

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>{t('loginTitle')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          {t('loginText')}
        </Typography>
      </Box>

      <Stack spacing={1.25}>
        <Box ref={googleButtonRef} sx={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
        <Button variant="outlined" size="large" startIcon={<SportsEsportsIcon />} disabled>
          {t('loginSteam')}
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }}>{t('or')}</Divider>

      {(error || googleError) && <Alert severity="error" sx={{ mb: 2 }}>{error || googleError}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={1.75}>
          <TextField fullWidth label="Email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField fullWidth label={t('password')} type="password" autoComplete="current-password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <Box sx={{ textAlign: 'right', mt: -0.75 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              {t('forgotPassword')}
            </Link>
          </Box>
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<LoginIcon />} disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
        {t('noAccount')} <Link component={RouterLink} to="/register">{t('registerLink')}</Link>
      </Typography>
    </>
  )
}
