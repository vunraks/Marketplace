import { useEffect } from 'react'
import { Typography, Paper, Box, Chip, Button, Alert } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { becomeSeller, fetchProfile } from '../store/authSlice'
import { formatDate } from '../utils/format'

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { profile, user } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(fetchProfile())
  }, [dispatch])

  if (!profile) return null

  return (
    <Paper sx={{ p: 4, maxWidth: 640, border: '1px solid #E2E8F0' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Профиль</Typography>
      <Typography variant="h6">@{profile.username}</Typography>
      <Typography color="text.secondary" gutterBottom>{profile.email}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        На сайте с {formatDate(profile.createdAt)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {profile.roles.map((r) => <Chip key={r} label={r} color="primary" variant="outlined" />)}
      </Box>
      {profile.bio && <Typography sx={{ mb: 2 }}>{profile.bio}</Typography>}
      {!user?.roles.includes('Seller') && (
        <Alert severity="info" action={
          <Button color="inherit" size="small" onClick={() => dispatch(becomeSeller())}>Стать продавцом</Button>
        }>
          Хотите продавать товары? Получите роль продавца
        </Alert>
      )}
    </Paper>
  )
}
