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
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { CategoryTree, ListingCard as ListingCardType } from '../types'

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [listings, setListings] = useState<ListingCardType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      categoriesApi.getTree(),
      listingsApi.getList({ pageSize: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
    ])
      .then(([catRes, listRes]) => {
        setCategories(catRes.data.slice(0, 6))
        setListings(listRes.data.items)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <>
      <Box className="hero-section">
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Chip icon={<BoltIcon />} label="моментальная витрина" color="primary" />
            <Chip icon={<SecurityIcon />} label="модерация сделок" variant="outlined" />
          </Stack>
          <Typography variant="h2" sx={{ maxWidth: 760, mb: 1.5, letterSpacing: 0 }}>
            Маркет цифровых товаров для игроков и продавцов
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 650, mb: 3, lineHeight: 1.55 }}>
            Аккаунты, ключи, подписки и услуги в одной быстрой витрине. Всё важное видно сразу: цена, продавец, категория и статус объявления.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button component={RouterLink} to="/catalog" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
              Смотреть каталог
            </Button>
            <Button component={RouterLink} to="/my-listings/create" variant="outlined" size="large">
              Продать товар
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={1.5}>
          {[
            ['24/7', 'доступ к товарам'],
            ['6+', 'категорий'],
            ['TOP', 'выделенные предложения'],
            ['Safe', 'проверка модерацией'],
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
            <Typography variant="h5">Категории</Typography>
            <Typography variant="body2" color="text.secondary">Быстрый вход в популярные разделы</Typography>
          </Box>
          <AutoAwesomeIcon color="primary" />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} component={RouterLink} to={`/catalog?category=${c.slug}`} clickable color="primary" variant="outlined" />
          ))}
        </Box>
      </Box>

      <Box className="section-title-row">
        <Box>
          <Typography variant="h5">Новые объявления</Typography>
          <Typography variant="body2" color="text.secondary">Свежие активные предложения на витрине</Typography>
        </Box>
        <Button component={RouterLink} to="/catalog" endIcon={<ArrowForwardIcon />}>Все товары</Button>
      </Box>

      {listings.length === 0 ? (
        <Box className="surface-panel">
          <Typography color="text.secondary">Пока нет активных объявлений</Typography>
        </Box>
      ) : (
        <Box className="listing-grid">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </Box>
      )}
    </>
  )
}
