import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { OrderHistoryItem } from '../types'
import { formatDateTime, formatPrice, getErrorMessage } from '../utils/format'

const statusLabels: Record<string, string> = {
  Created: 'Ожидает подтверждения',
  Completed: 'Завершён',
  Disputed: 'Спор',
  Cancelled: 'Отменён',
  Refunded: 'Возврат',
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    commerceApi.getOrderHistory()
      .then((response) => setOrders(response.data))
      .catch((e) => setError(getErrorMessage(e, 'Не удалось загрузить историю заказов')))
      .finally(() => setLoading(false))
  }, [])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((order) => order.side === filter)
  }, [filter, orders])

  if (loading) return <LoadingSpinner />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptLongOutlinedIcon color="primary" />
            <Typography variant="h4" fontWeight={800}>История заказов</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Приватный список ваших покупок и продаж.
          </Typography>
        </Box>
        <TextField select size="small" label="Показать" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} sx={{ minWidth: 190 }}>
          <MenuItem value="all">Все заказы</MenuItem>
          <MenuItem value="buyer">Мои покупки</MenuItem>
          <MenuItem value="seller">Мои продажи</MenuItem>
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800}>Заказов пока нет</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Когда вы купите или продадите товар, он появится здесь.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.25}>
          {filteredOrders.map((order) => (
            <Paper key={order.id} sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Typography fontWeight={900}>#{order.orderNumber}</Typography>
                    <Chip label={statusLabels[order.status] ?? order.status} size="small" color={order.status === 'Completed' ? 'success' : order.status === 'Disputed' ? 'warning' : 'default'} />
                    <Chip label={order.side === 'buyer' ? 'Покупка' : 'Продажа'} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }} noWrap>
                    {order.listingTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Покупатель: {order.buyerUsername} · Продавец: {order.sellerUsername} · {formatDateTime(order.createdAt)}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} alignItems={{ xs: 'center', md: 'flex-end' }} justifyContent="space-between">
                  <Typography variant="h6" color="primary.main" fontWeight={900}>
                    {formatPrice(order.amount, order.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.quantity} шт.
                  </Typography>
                  <Button component={RouterLink} to={`/listing/${order.listingId}`} size="small" endIcon={<OpenInNewIcon />}>
                    Товар
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}
