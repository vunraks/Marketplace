import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Link as RouterLink } from 'react-router-dom'
import { listingsApi } from '../api/listingsApi'
import ListingCard from '../components/listing/ListingCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { ListingCard as ListingCardType } from '../types'
import { getErrorMessage } from '../utils/format'

export default function MyListingsPage() {
  const [listings, setListings] = useState<ListingCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    listingsApi
      .getMy()
      .then((response) => setListings(response.data.items))
      .catch((e) => setError(getErrorMessage(e, 'Не удалось загрузить объявления')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const removeListing = async (listing: ListingCardType) => {
    const confirmed = window.confirm(`Удалить объявление "${listing.title}"?`)
    if (!confirmed) return

    setProcessingId(listing.id)
    setError('')
    setNotice('')
    try {
      await listingsApi.remove(listing.id)
      setListings((current) => current.filter((item) => item.id !== listing.id))
      setNotice('Объявление удалено')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось удалить объявление'))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Мои объявления</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Создавайте, редактируйте и удаляйте свои товары.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={load}>Обновить</Button>
          <Button component={RouterLink} to="/my-listings/create" variant="contained" startIcon={<AddCircleOutlineIcon />}>
            Создать
          </Button>
        </Stack>
      </Box>

      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <LoadingSpinner />
      ) : listings.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800}>У вас пока нет объявлений</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>Создайте первый товар и отправьте его на модерацию.</Typography>
          <Button component={RouterLink} to="/my-listings/create" variant="contained">Создать объявление</Button>
        </Paper>
      ) : (
        <Box className="listing-grid">
          {listings.map((listing) => (
            <Box key={listing.id} sx={{ position: 'relative' }}>
              <Chip
                label={listing.status}
                size="small"
                sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
                color={listing.status === 'Active' ? 'success' : listing.status === 'Rejected' ? 'error' : 'default'}
              />
              <Paper sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 0.25, p: 0.5, borderRadius: 1.5, bgcolor: 'rgba(8,13,18,0.86)', backdropFilter: 'blur(10px)' }}>
                <IconButton component={RouterLink} to={`/listing/${listing.id}`} size="small" title="Открыть">
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
                <IconButton component={RouterLink} to={`/my-listings/${listing.id}/edit`} size="small" title="Редактировать">
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" title="Удалить" color="error" disabled={processingId === listing.id} onClick={() => removeListing(listing)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Paper>
              <ListingCard listing={listing} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
