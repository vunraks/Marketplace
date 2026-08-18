import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { useNavigate, useParams } from 'react-router-dom'
import { categoriesApi } from '../api/categoriesApi'
import { listingsApi } from '../api/listingsApi'
import type { CategoryTree, ListingImage } from '../types'
import { assetUrl, getErrorMessage, imagePlaceholder } from '../utils/format'
import { useTranslation } from '../i18n/LanguageProvider'

type FormData = {
  categoryId: string
  title: string
  description: string
  price: number
  stockQuantity: number
  deliveryInfo?: string
  tags?: string
}

function flattenCategories(cats: CategoryTree[]): CategoryTree[] {
  return cats.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
}

const getCreateListingError = (error: unknown, fallback: string) => {
  const status = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined

  if (status === 403) {
    return 'Создавать объявления может только продавец. Если вы уже нажимали "Стать продавцом", обновите профиль или войдите заново. Также доступ может быть временно ограничен администратором.'
  }

  return getErrorMessage(error, fallback)
}

export default function CreateListingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [existingImages, setExistingImages] = useState<ListingImage[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditMode)
  const [files, setFiles] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const schema = z.object({
    categoryId: z.string().min(1, t('selectCategory')),
    title: z.string().min(5, t('min5')).max(200),
    description: z.string().min(20, t('min20')),
    price: z.number({ error: t('priceRequired') }).min(0, t('priceNotNegative')),
    stockQuantity: z.number({ error: t('stockRequired') }).int(t('integerOnly')).min(1, t('minOneItem')),
    deliveryInfo: z.string().optional(),
    tags: z.string().optional(),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '', title: '', description: '', price: 0, stockQuantity: 1, deliveryInfo: '', tags: '' },
  })

  useEffect(() => {
    categoriesApi
      .getTree()
      .then((response) => setCategories(flattenCategories(Array.isArray(response.data) ? response.data : [])))
      .catch(() => setError(t('loadCategoriesFail')))
  }, [t])

  useEffect(() => {
    if (!id) return

    setLoading(true)
    setError('')
    listingsApi
      .getById(id)
      .then((response) => {
        const listing = response.data
        reset({
          categoryId: listing.categoryId,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          stockQuantity: listing.stockQuantity,
          deliveryInfo: listing.deliveryInfo ?? '',
          tags: listing.tags.join(', '),
        })
        setExistingImages(listing.images)
      })
      .catch((e) => setError(getErrorMessage(e, t('loadListingFail'))))
      .finally(() => setLoading(false))
  }, [id, reset, t])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const selectFiles = (selected: FileList | null) => {
    const nextFiles = Array.from(selected ?? []).slice(0, 6)
    setFiles(nextFiles)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(nextFiles[0] ? URL.createObjectURL(nextFiles[0]) : null)
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        price: data.price,
        stockQuantity: data.stockQuantity,
        deliveryInfo: data.deliveryInfo,
        tags: data.tags?.split(',').map((tag) => tag.trim()).filter(Boolean),
      }

      const { data: listing } = id
        ? await listingsApi.update(id, payload)
        : await listingsApi.create(payload)

      const finalListing = files.length > 0
        ? (await listingsApi.uploadImages(listing.id, files)).data
        : listing

      navigate(`/listing/${finalListing.id}`)
    } catch (e) {
      setError(getCreateListingError(e, isEditMode ? t('saveListingFail') : t('createListingFail')))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 4, maxWidth: 760, mx: 'auto' }}>
        <Typography>{t('loadingListing')}</Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 760, mx: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        {isEditMode ? t('editListing') : t('newListing')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t('moderationAfterSave')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField select fullWidth label={t('category')} {...register('categoryId')} error={!!errors.categoryId} helperText={errors.categoryId?.message}>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label={t('title')} {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
          <TextField fullWidth label={t('description')} multiline rows={7} {...register('description')} error={!!errors.description} helperText={errors.description?.message} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField fullWidth label={t('pricePerItem')} type="number" {...register('price', { valueAsNumber: true })} error={!!errors.price} helperText={errors.price?.message} />
            <TextField fullWidth label={t('quantityPieces')} type="number" {...register('stockQuantity', { valueAsNumber: true })} error={!!errors.stockQuantity} helperText={errors.stockQuantity?.message} />
          </Stack>
          <TextField fullWidth label={t('deliveryInfo')} {...register('deliveryInfo')} />
          <TextField fullWidth label={t('tagsComma')} {...register('tags')} />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.025)' }}>
            <Stack spacing={2}>
              {existingImages.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {existingImages.map((image) => (
                    <Box
                      key={image.id}
                      component="img"
                      src={assetUrl(image.url) ?? imagePlaceholder}
                      alt={image.altText ?? t('image')}
                      onError={(event) => {
                        event.currentTarget.src = imagePlaceholder
                      }}
                      sx={{ width: 112, height: 82, objectFit: 'cover', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </Box>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Box sx={{ width: { xs: '100%', sm: 180 }, aspectRatio: '16 / 10', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                  {previewUrl ? (
                    <Box component="img" src={previewUrl} alt={t('preview')} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageOutlinedIcon color="primary" />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={800}>{t('addProductImages')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('uploadImagesHint')}
                  </Typography>
                  <Button component="label" variant="outlined" startIcon={<ImageOutlinedIcon />}>
                    {t('chooseImages')}
                    <input hidden type="file" accept="image/*" multiple onChange={(event) => selectFiles(event.target.files)} />
                  </Button>
                  {files.length > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('selectedFiles')}: {files.length}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <Button type="submit" variant="contained" size="large" disabled={submitting} startIcon={<SaveOutlinedIcon />}>
            {submitting ? t('saving') : isEditMode ? t('saveChanges') : t('sendToModeration')}
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
