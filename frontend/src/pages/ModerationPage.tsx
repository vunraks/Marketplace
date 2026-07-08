import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { listingsApi } from '../api/listingsApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { ListingCard } from '../types'
import { formatPrice } from '../utils/format'

export default function ModerationPage() {
  const [listings, setListings] = useState<ListingCard[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadPending = () => {
    setLoading(true)
    setError('')
    listingsApi
      .getList({ pageSize: 100, status: 'PendingModeration' })
      .then((r) => setListings(r.data.items))
      .catch(() => setError('Не удалось загрузить объявления на модерации'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPending()
  }, [])

  const updateStatus = async (id: string, status: 'Active' | 'Rejected') => {
    setProcessingId(id)
    setError('')

    try {
      await listingsApi.updateStatus(id, status)
      setListings((current) => current.filter((listing) => listing.id !== id))
    } catch {
      setError(status === 'Active' ? 'Не удалось одобрить объявление' : 'Не удалось отклонить объявление')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Модерация объявлений</Typography>
        <Chip label={listings.length} color={listings.length > 0 ? 'warning' : 'success'} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {listings.length === 0 ? (
        <Alert severity="success">Нет объявлений, ожидающих модерации</Alert>
      ) : (
        <Stack spacing={2}>
          {listings.map((listing) => (
            <Paper key={listing.id} sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ minWidth: 0, flex: '1 1 320px' }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={listing.categoryName} size="small" variant="outlined" />
                    <Chip label={listing.status} size="small" color="warning" />
                  </Stack>
                  <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                    {listing.title}
                  </Typography>
                  <Typography color="primary.main" fontWeight={700}>
                    {formatPrice(listing.price, listing.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Продавец: {listing.sellerUsername}
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignSelf: 'center' }}>
                  <Button
                    component={RouterLink}
                    to={`/listing/${listing.id}`}
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                  >
                    Открыть
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    disabled={processingId === listing.id}
                    onClick={() => updateStatus(listing.id, 'Active')}
                  >
                    Одобрить
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    disabled={processingId === listing.id}
                    onClick={() => updateStatus(listing.id, 'Rejected')}
                  >
                    Отклонить
                  </Button>
                </Stack>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}
