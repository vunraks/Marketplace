import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Link as RouterLink } from 'react-router-dom'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { SellerDashboard } from '../types'
import { formatDate, formatPrice } from '../utils/format'

export default function SellerDashboardPage() {
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    commerceApi
      .getSellerDashboard()
      .then((r) => setDashboard(r.data))
      .catch(() => setError('Не удалось загрузить кабинет продавца'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!dashboard) return null

  const stats = dashboard.stats
  const statCards = [
    { title: 'Выручка всего', value: formatPrice(stats.revenueTotal, 'RUB'), icon: <TrendingUpIcon /> },
    { title: 'За 7 дней', value: formatPrice(stats.revenueWeek, 'RUB'), icon: <TrendingUpIcon /> },
    { title: 'Активные товары', value: stats.activeListings, icon: <Inventory2OutlinedIcon /> },
    { title: 'Открытые заказы', value: stats.openOrders, icon: <ReceiptLongOutlinedIcon /> },
    { title: 'Споры', value: stats.disputedOrders, icon: <ReportProblemOutlinedIcon /> },
    { title: 'Просмотры', value: stats.totalViews, icon: <Inventory2OutlinedIcon /> },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" fontWeight={900}>Кабинет продавца</Typography>
          <Typography color="text.secondary">Продажи, остатки, заказы и спорные ситуации в одном месте.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/my-listings" variant="outlined">Мои товары</Button>
          <Button component={RouterLink} to="/my-listings/create" variant="contained" startIcon={<AddCircleOutlineIcon />}>Создать</Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'rgba(101,212,110,0.1)' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2">{card.title}</Typography>
                  <Typography variant="h5" fontWeight={900}>{card.value}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Box className="section-title-row">
              <Typography variant="h6">Последние заказы</Typography>
              <Chip label={stats.totalOrders} size="small" />
            </Box>
            {dashboard.recentOrders.length === 0 ? (
              <Typography color="text.secondary">Заказов пока нет</Typography>
            ) : (
              <Stack spacing={1.5}>
                {dashboard.recentOrders.map((order) => (
                  <Paper key={order.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} noWrap>{order.listingTitle}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.orderNumber} · {order.buyerUsername} · {formatDate(order.createdAt)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={order.status} size="small" />
                        <Typography fontWeight={900}>{formatPrice(order.amount, order.currency)}</Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Box className="section-title-row">
              <Typography variant="h6">Нужно внимание</Typography>
              <Chip label={dashboard.attentionListings.length} size="small" color={dashboard.attentionListings.length ? 'warning' : 'success'} />
            </Box>
            {dashboard.attentionListings.length === 0 ? (
              <Typography color="text.secondary">Все товары выглядят спокойно</Typography>
            ) : (
              <Stack spacing={1.25}>
                {dashboard.attentionListings.map((listing) => (
                  <Paper key={listing.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography fontWeight={800}>{listing.title}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Chip label={listing.status} size="small" />
                      <Chip label={`${listing.stockQuantity} шт.`} size="small" color={listing.stockQuantity <= 2 ? 'warning' : 'default'} />
                      <Chip label={`${listing.viewCount} просмотров`} size="small" variant="outlined" />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
