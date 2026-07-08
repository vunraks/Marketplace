import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Typography, Box, Rating, Alert } from '@mui/material'
import { usersApi } from '../api/usersApi'
import { listingsApi } from '../api/listingsApi'
import ListingCard from '../components/listing/ListingCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { PublicUserProfile, ListingCard as ListingCardType } from '../types'
import { formatDate } from '../utils/format'

export default function SellerPage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [listings, setListings] = useState<ListingCardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
    Promise.all([
      usersApi.getPublic(username),
      listingsApi.getList({ pageSize: 20, status: 'Active' }),
    ])
      .then(([profileRes, listRes]) => {
        setProfile(profileRes.data)
        setListings(listRes.data.items.filter((l) => l.sellerUsername === username))
      })
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <LoadingSpinner />
  if (!profile) return <Alert severity="error">Продавец не найден</Alert>

  return (
    <>
      <Typography variant="h4" fontWeight={700}>@{profile.username}</Typography>
      {profile.bio && <Typography color="text.secondary" sx={{ mb: 1 }}>{profile.bio}</Typography>}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {profile.averageRating != null && <Rating value={profile.averageRating} readOnly precision={0.1} />}
        <Typography variant="body2" color="text.secondary">
          {profile.totalReviews} отзывов · {profile.activeListingsCount} объявлений · с {formatDate(profile.memberSince)}
        </Typography>
      </Box>
      <Box className="listing-grid">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </Box>
    </>
  )
}
