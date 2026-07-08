import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, TextField, MenuItem, Box, Paper, Chip } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { listingsApi } from '../api/listingsApi'
import { categoriesApi } from '../api/categoriesApi'
import ListingCard from '../components/listing/ListingCard'
import PaginationBar from '../components/common/PaginationBar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { CategoryTree, ListingCard as ListingCardType } from '../types'

function flattenCategories(cats: CategoryTree[]): CategoryTree[] {
  return cats.flatMap((c) => [c, ...flattenCategories(c.children ?? [])])
}

export default function CatalogPage() {
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
    categoriesApi.getTree().then((r) => setCategories(r.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    listingsApi
      .getList({ page, pageSize: 12, search: search || undefined, categoryId, sortBy, sortOrder: 'desc', status: 'Active' })
      .then((r) => {
        setListings(r.data.items)
        setTotalPages(r.data.totalPages)
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
          <Typography variant="h4" fontWeight={800}>Каталог</Typography>
          <Typography variant="body2" color="text.secondary">Фильтруйте цифровые товары по категории, цене и названию</Typography>
        </Box>
        <Chip label={`${listings.length} на странице`} color="primary" variant="outlined" />
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Поиск" value={search} onChange={(e) => updateParam('q', e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth label="Категория" value={categorySlug} onChange={(e) => updateParam('category', e.target.value)}>
              <MenuItem value="">Все</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.slug}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField select fullWidth label="Сортировка" value={sortBy} onChange={(e) => updateParam('sortBy', e.target.value)}>
              <MenuItem value="createdAt">По дате</MenuItem>
              <MenuItem value="price">По цене</MenuItem>
              <MenuItem value="title">По названию</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LoadingSpinner />
      ) : listings.length === 0 ? (
        <Box className="surface-panel">
          <Typography color="text.secondary">Ничего не найдено</Typography>
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
