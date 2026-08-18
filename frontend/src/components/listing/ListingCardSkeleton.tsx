import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material'
import '../../styles/listing-card.scss'

export default function ListingCardSkeleton() {
  return (
    <Card className="listing-card listing-card--skeleton">
      <Box className="listing-card__media">
        <Skeleton variant="rectangular" height={148} animation="wave" />
      </Box>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
          <Skeleton variant="rounded" width="48%" height={24} animation="wave" />
          <Skeleton variant="rounded" width={64} height={24} animation="wave" />
        </Stack>
        <Skeleton variant="text" width="86%" height={28} animation="wave" />
        <Skeleton variant="text" width="46%" height={34} animation="wave" />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Skeleton variant="circular" width={18} height={18} animation="wave" />
          <Skeleton variant="text" width="55%" height={20} animation="wave" />
        </Stack>
      </CardContent>
    </Card>
  )
}
