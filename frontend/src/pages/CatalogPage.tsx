import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, TextField, MenuItem, Box, Paper, Chip } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { listingsApi } from '../api/listingsApi'
import { categoriesApi } from '../api/categoriesApi'
import ListingCard from '../components/listing/ListingCard'
import PaginationBar from '../components/common/PaginationBar'
import type { CategoryTree, ListingCard as ListingCardType } from '../types'
import { useTranslation } from '../i18n/LanguageProvider'
import ListingCardSkeleton from '../components/listing/ListingCardSkeleton'

function flattenCategories(cats: CategoryTree[]): CategoryTree[] {
  return cats.flatMap((c) => [c, ...flattenCategories(c.children ?? [])])
}

export default function CatalogPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [listings, setListings] = useState<ListingCardType[]>([])
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const page = Number(params.get('page') ?? 1)
  const search = params.get('q') ?? ''
  const categorySlug = params.get('category') ?? ''
  const sortBy = params.get('sortBy') ?? 'createdAt'

  const categoryId = flattenCategories(categories).find((c) => c.slug === categorySlug)?.id

  useEffect(() => {
    categoriesApi.getTree().then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
  }, [])

  useEffect(() => {
    setLoading(true)
    listingsApi
      .getList({ page, pageSize: 12, search: search || undefined, categoryId, sortBy, sortOrder: 'desc', status: 'Active' })
      .then((r) => {
        setListings(Array.isArray(r.data.items) ? r.data.items : [])
        setTotalPages(Number(r.data.totalPages) || 1)
      })
      .finally(() => setLoading(false))
  }, [page, search, categoryId, sortBy])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  return (
    <>
      <Box className="section-title-row">
        <Box>
          <Typography variant="h4" fontWeight={800}>{t('catalogTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('catalogSubtitle')}</Typography>
        </Box>
        <Chip label={`${listings.length} ${t('itemsOnPage')}`} color="primary" variant="outlined" />
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label={t('search')} value={search} onChange={(e) => updateParam('q', e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth label={t('category')} value={categorySlug} onChange={(e) => updateParam('category', e.target.value)}>
              <MenuItem value="">{t('all')}</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.slug}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth label={t('sorting')} value={sortBy} onChange={(e) => updateParam('sortBy', e.target.value)}>
              <MenuItem value="createdAt">{t('byDate')}</MenuItem>
              <MenuItem value="price">{t('byPrice')}</MenuItem>
              <MenuItem value="title">{t('byTitle')}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box className="listing-grid">
          {Array.from({ length: 12 }).map((_, index) => <ListingCardSkeleton key={index} />)}
        </Box>
      ) : listings.length === 0 ? (
        <Box className="surface-panel">
          <Typography color="text.secondary">{t('nothingFound')}</Typography>
        </Box>
      ) : (
        <>
          <Box className="listing-grid">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </Box>
          <PaginationBar page={page} totalPages={totalPages} onChange={(p) => updateParam('page', String(p))} />
        </>
      )}
    </>
  )
}
