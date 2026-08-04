import { useEffect, useState } from 'react'
import { Alert, Box, Button, Paper, Typography } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { Link as RouterLink } from 'react-router-dom'
import { commerceApi } from '../api/commerceApi'
import ListingCard from '../components/listing/ListingCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { ListingCard as ListingCardType } from '../types'

export default function FavoritesPage() {
  const [items, setItems] = useState<ListingCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    commerceApi
      .getFavorites()
      .then((r) => setItems(r.data))
      .catch(() => setError('Не удалось загрузить избранное'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <FavoriteIcon color="primary" />
        <Typography variant="h4" fontWeight={800}>Избранное</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {items.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800}>Пока ничего не сохранено</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Добавляйте товары в избранное, чтобы быстро вернуться к ним перед покупкой.
          </Typography>
          <Button component={RouterLink} to="/catalog" variant="contained">Открыть каталог</Button>
        </Paper>
      ) : (
        <Box className="listing-grid">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </Box>
      )}
    </Box>
  )
}
