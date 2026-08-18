import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Typography, TextField, Button, Alert, Link, Stack, Divider, Box } from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearError, loginWithGoogle, register as registerUser } from '../store/authSlice'
import { renderGoogleSignInButton } from '../utils/googleAuth'
import { useTranslation } from '../i18n/LanguageProvider'

type FormData = {
  email: string
  username: string
  password: string
  confirmPassword: string
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

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>{t('registerTitle')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          {t('registerText')}
        </Typography>
      </Box>

      <Stack spacing={1.25}>
        <Box ref={googleButtonRef} sx={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
        <Button variant="outlined" size="large" startIcon={<SportsEsportsIcon />} disabled>
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
