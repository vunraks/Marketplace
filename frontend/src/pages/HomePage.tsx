import { useEffect, useState } from 'react'
import { Typography, Button, Box, Chip, Stack, Paper } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Link as RouterLink } from 'react-router-dom'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import BoltIcon from '@mui/icons-material/Bolt'
import SecurityIcon from '@mui/icons-material/Security'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { categoriesApi } from '../api/categoriesApi'
import { listingsApi } from '../api/listingsApi'
import ListingCard from '../components/listing/ListingCard'
import ListingCardSkeleton from '../components/listing/ListingCardSkeleton'
import type { CategoryTree, ListingCard as ListingCardType } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'

export default function HomePage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [listings, setListings] = useState<ListingCardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      categoriesApi.getTree(),
      listingsApi.getList({ pageSize: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
    ])
      .then(([catRes, listRes]) => {
        setCategories(Array.isArray(catRes.data) ? catRes.data.slice(0, 6) : [])
        setListings(Array.isArray(listRes.data.items) ? listRes.data.items : [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Box className="hero-section">
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Chip icon={<BoltIcon />} label={t('heroBadgeInstant')} color="primary" />
            <Chip icon={<SecurityIcon />} label={t('heroBadgeModeration')} variant="outlined" />
          </Stack>
          <Typography variant="h2" sx={{ maxWidth: 760, mb: 1.5, letterSpacing: 0 }}>
            {t('heroTitle')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 650, mb: 3, lineHeight: 1.55 }}>
            {t('heroText')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button component={RouterLink} to="/catalog" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
              {t('viewCatalog')}
            </Button>
            <Button component={RouterLink} to="/my-listings/create" variant="outlined" size="large">
              {t('sellProduct')}
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={1.5}>
          {[
            ['24/7', t('heroAvailability')],
            ['6+', t('heroCategories')],
            ['TOP', t('heroTop')],
            ['Safe', t('heroSafe')],
          ].map(([value, label]) => (
            <Grid key={label} size={{ xs: 6 }}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(8,13,18,0.58)' }}>
                <Typography variant="h4" color="primary.main">{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box className="surface-panel" sx={{ mb: 3 }}>
        <Box className="section-title-row">
          <Box>
            <Typography variant="h5">{t('categories')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('categoriesText')}</Typography>
          </Box>
          <AutoAwesomeIcon color="primary" />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {loading ? Array.from({ length: 6 }).map((_, index) => (
            <Chip key={index} label=" " sx={{ width: 110 }} variant="outlined" />
          )) : categories.map((c) => (
            <Chip key={c.id} label={c.name} component={RouterLink} to={`/catalog?category=${c.slug}`} clickable color="primary" variant="outlined" />
          ))}
        </Box>
      </Box>

      <Box className="section-title-row">
        <Box>
          <Typography variant="h5">{t('newListings')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('newListingsText')}</Typography>
        </Box>
        <Button component={RouterLink} to="/catalog" endIcon={<ArrowForwardIcon />}>{t('allProducts')}</Button>
      </Box>

      {loading ? (
        <Box className="listing-grid">
          {Array.from({ length: 8 }).map((_, index) => <ListingCardSkeleton key={index} />)}
        </Box>
      ) : listings.length === 0 ? (
        <Box className="surface-panel">
          <Typography color="text.secondary">{t('noActiveListings')}</Typography>
        </Box>
      ) : (
        <Box className="listing-grid">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </Box>
      )}
    </>
  )
}
