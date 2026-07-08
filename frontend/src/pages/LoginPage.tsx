import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Typography, TextField, Button, Alert, Link, Stack, Divider, Box } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import LoginIcon from '@mui/icons-material/Login'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearError, login, loginWithGoogle } from '../store/authSlice'
import { getGoogleIdToken } from '../utils/googleAuth'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [googleError, setGoogleError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    dispatch(clearError())
    const result = await dispatch(login(data))
    if (login.fulfilled.match(result)) navigate('/')
  }

  const startGoogleLogin = async () => {
    dispatch(clearError())
    setGoogleError('')
    try {
      const idToken = await getGoogleIdToken()
      const result = await dispatch(loginWithGoogle(idToken))
      if (loginWithGoogle.fulfilled.match(result)) navigate('/')
    } catch (e) {
      setGoogleError(e instanceof Error ? e.message : 'Не удалось войти через Google')
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Вход</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Вернитесь к своим товарам, модерации и покупкам.
        </Typography>
      </Box>

      <Stack spacing={1.25}>
        <Button variant="outlined" size="large" startIcon={<GoogleIcon />} onClick={startGoogleLogin} disabled={loading}>
          Войти через Google
        </Button>
        <Button variant="outlined" size="large" startIcon={<SportsEsportsIcon />} disabled>
          Войти через Steam
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }}>или</Divider>

      {(error || googleError) && <Alert severity="error" sx={{ mb: 2 }}>{error || googleError}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={1.75}>
          <TextField fullWidth label="Email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField fullWidth label="Пароль" type="password" autoComplete="current-password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<LoginIcon />} disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
        Нет аккаунта? <Link component={RouterLink} to="/register">Зарегистрироваться</Link>
      </Typography>
    </>
  )
}
