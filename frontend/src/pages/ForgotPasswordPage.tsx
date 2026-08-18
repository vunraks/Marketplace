import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { Link as RouterLink } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { getErrorMessage } from '../utils/format'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setBusy(true)
    setError('')
    try {
      await authApi.forgotPassword(data)
      setSent(true)
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось отправить письмо восстановления'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>Восстановление пароля</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Введите email аккаунта, и мы отправим ссылку для сброса пароля.
        </Typography>
      </Box>

      {sent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Если такой email есть в системе, письмо со ссылкой уже отправлено.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={1.75}>
          <TextField fullWidth label="Email" autoComplete="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<MarkEmailReadOutlinedIcon />} disabled={busy}>
            Отправить ссылку
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: 'center', color: 'text.secondary' }}>
        Вспомнили пароль? <Link component={RouterLink} to="/login">Войти</Link>
      </Typography>
    </>
  )
}
