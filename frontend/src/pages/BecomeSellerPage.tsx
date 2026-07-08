import { Typography, Paper, Button, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { becomeSeller } from '../store/authSlice'

export default function BecomeSellerPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((s) => s.auth)

  const isSeller = user?.roles.some((r) => ['Seller', 'Moderator', 'Admin'].includes(r))

  const handleBecome = async () => {
    await dispatch(becomeSeller())
    navigate('/my-listings/create')
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 560, mx: 'auto', border: '1px solid #E2E8F0' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Стать продавцом</Typography>
      {isSeller ? (
        <Alert severity="success">Вы уже продавец! Можете создавать объявления.</Alert>
      ) : (
        <>
          <Typography color="text.secondary" paragraph>
            Получите роль продавца, чтобы размещать объявления на VaultTrade. Объявления проходят модерацию перед публикацией.
          </Typography>
          <Button variant="contained" size="large" onClick={handleBecome}>Стать продавцом</Button>
        </>
      )}
    </Paper>
  )
}
