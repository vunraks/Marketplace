import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { getErrorMessage } from '../utils/format'

const schema = z.object({
  newPassword: z.string().min(8, 'Минимум 8 символов'),
  confirmPassword: z.string().min(8, 'Повторите пароль'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Ссылка восстановления некорректная или без токена.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await authApi.resetPassword({ token, ...data })
      setDone(true)
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось изменить пароль'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Новый пароль</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Придумайте новый пароль для входа в аккаунт.
        </Typography>
      </Box>

      {!token && <Alert severity="warning" sx={{ mb: 2 }}>В ссылке нет токена восстановления.</Alert>}
      {done && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Пароль изменён. Теперь можно войти с новым паролем.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={1.75}>
          <TextField fullWidth label="Новый пароль" type="password" autoComplete="new-password" {...register('newPassword')} error={!!errors.newPassword} helperText={errors.newPassword?.message} />
          <TextField fullWidth label="Повторите пароль" type="password" autoComplete="new-password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<LockResetOutlinedIcon />} disabled={busy || done}>
            Сохранить пароль
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
        <Link component={RouterLink} to="/login">Вернуться ко входу</Link>
      </Typography>
    </>
  )
}
