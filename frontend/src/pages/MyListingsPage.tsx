import { useEffect, useState } from 'react'
import { Typography, Button, Box, Chip } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { listingsApi } from '../api/listingsApi'
import ListingCard from '../components/listing/ListingCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { ListingCard as ListingCardType } from '../types'

export default function MyListingsPage() {
  const [listings, setListings] = useState<ListingCardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listingsApi.getMy().then((r) => setListings(r.data.items)).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Мои объявления</Typography>
        <Button component={RouterLink} to="/my-listings/create" variant="contained">Создать</Button>
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : listings.length === 0 ? (
        <Typography color="text.secondary">У вас пока нет объявлений</Typography>
      ) : (
        <Box className="listing-grid">
          {listings.map((l) => (
            <Box key={l.id} sx={{ position: 'relative' }}>
              <Chip label={l.status} size="small" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} color={l.status === 'Active' ? 'success' : 'default'} />
              <ListingCard listing={l} />
            </Box>
          ))}
        </Box>
      )}
    </>
  )
}
