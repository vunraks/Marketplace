import { Card, CardActionArea, CardContent, CardMedia, Chip, Typography, Box, Rating } from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import { Link as RouterLink } from 'react-router-dom'
import type { ListingCard as ListingCardType } from '../../types'
import { assetUrl, formatPrice } from '../../utils/format'
import '../../styles/listing-card.scss'

interface Props {
  listing: ListingCardType
}

export default function ListingCard({ listing }: Props) {
  const imageUrl = assetUrl(listing.primaryImageUrl) ?? 'https://placehold.co/400x240?text=VaultTrade'

  return (
    <Card className="listing-card">
      <CardActionArea component={RouterLink} to={`/listing/${listing.id}`}>
        <Box className="listing-card__media">
          <CardMedia component="img" height="148" image={imageUrl} alt={listing.title} sx={{ objectFit: 'cover' }} />
          {listing.isFeatured && <Chip className="listing-card__badge" label="TOP" size="small" color="primary" />}
        </Box>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
            <Chip label={listing.categoryName} size="small" variant="outlined" sx={{ maxWidth: '72%' }} />
            <Chip label={listing.status} size="small" color={listing.status === 'Active' ? 'success' : 'default'} />
          </Box>
          <Typography variant="subtitle1" fontWeight={600} noWrap title={listing.title}>{listing.title}</Typography>
          <Typography variant="h6" color="primary.main" sx={{ mt: 1, lineHeight: 1.1 }}>{formatPrice(listing.price, listing.currency)}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.25, minWidth: 0 }}>
            <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary" noWrap>{listing.sellerUsername}</Typography>
            {listing.sellerRating != null && (
              <Rating value={listing.sellerRating} readOnly size="small" precision={0.1} max={5} />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
