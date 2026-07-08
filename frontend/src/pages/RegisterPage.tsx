import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Typography, TextField, Button, Alert, Link, Stack, Divider, Box } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearError, loginWithGoogle, register as registerUser } from '../store/authSlice'
import { getGoogleIdToken } from '../utils/googleAuth'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  username: z.string().min(3, 'Минимум 3 символа').regex(/^[a-zA-Z0-9_]+$/, 'Только буквы, цифры и _'),
  password: z.string().min(8, 'Минимум 8 символов').regex(/[A-Z]/, 'Нужна заглавная буква').regex(/[a-z]/, 'Нужна строчная буква').regex(/[0-9]/, 'Нужна цифра'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Пароли не совпадают', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [googleError, setGoogleError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    dispatch(clearError())
    const result = await dispatch(registerUser(data))
    if (registerUser.fulfilled.match(result)) navigate('/login')
  }

  const startGoogleLogin = async () => {
    dispatch(clearError())
    setGoogleError('')
    try {
      const idToken = await getGoogleIdToken()
      const result = await dispatch(loginWithGoogle(idToken))
      if (loginWithGoogle.fulfilled.match(result)) navigate('/')
    } catch (e) {
      setGoogleError(e instanceof Error ? e.message : 'Не удалось продолжить через Google')
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Регистрация</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Создайте аккаунт продавца или покупателя за пару минут.
        </Typography>
      </Box>

      <Stack spacing={1.25}>
        <Button variant="outlined" size="large" startIcon={<GoogleIcon />} onClick={startGoogleLogin} disabled={loading}>
          Продолжить с Google
        </Button>
        <Button variant="outlined" size="large" startIcon={<SportsEsportsIcon />} disabled>
          Продолжить со Steam
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }}>или</Divider>

      {(error || googleError) && <Alert severity="error" sx={{ mb: 2 }}>{error || googleError}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={1.75}>
          <TextField fullWidth label="Email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField fullWidth label="Имя пользователя" autoComplete="username" {...register('username')} error={!!errors.username} helperText={errors.username?.message} />
          <TextField fullWidth label="Пароль" type="password" autoComplete="new-password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <TextField fullWidth label="Повторите пароль" type="password" autoComplete="new-password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<PersonAddAltIcon />} disabled={loading}>
            {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
        Уже есть аккаунт? <Link component={RouterLink} to="/login">Войти</Link>
      </Typography>
    </>
  )
}
