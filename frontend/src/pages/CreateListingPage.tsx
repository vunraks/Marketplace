import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, Box, Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { useNavigate, useParams } from 'react-router-dom'
import { categoriesApi } from '../api/categoriesApi'
import { listingsApi } from '../api/listingsApi'
import type { CategoryTree, ListingImage } from '../types'
import { getErrorMessage, imagePlaceholder, listingImageUrl } from '../utils/format'
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

type StockImage = {
  id: string
  label: string
  path: string
  categorySlugs: string[]
}

const stockImages: StockImage[] = [
  { id: 'steam-market', label: 'Steam', path: '/stock-listings/steam-market.webp', categorySlugs: ['steam'] },
  { id: 'epic-games', label: 'Epic Games', path: '/stock-listings/epic-games.webp', categorySlugs: ['epic-games'] },
  { id: 'riot-games', label: 'Riot Games', path: '/stock-listings/riot-games.webp', categorySlugs: ['riot-games'] },
  { id: 'game-accounts', label: 'Игровые аккаунты', path: '/stock-listings/game-accounts.svg', categorySlugs: ['game-accounts', 'gaming-accounts', 'accounts'] },
  { id: 'game-items', label: 'Игровые предметы', path: '/stock-listings/game-items.webp', categorySlugs: ['game-items', 'items'] },
  { id: 'software', label: 'Программы', path: '/stock-listings/software.svg', categorySlugs: ['software', 'programs'] },
  { id: 'license-keys', label: 'Ключи', path: '/stock-listings/license-keys.webp', categorySlugs: ['license-keys', 'keys'] },
  { id: 'subscriptions', label: 'Подписки', path: '/stock-listings/subscriptions.svg', categorySlugs: ['subscriptions'] },
  { id: 'digital-services', label: 'Цифровые услуги', path: '/stock-listings/digital-services.svg', categorySlugs: ['digital-services', 'services'] },
]

const getStockImagesForCategory = (slug?: string) => {
  if (!slug) return stockImages

  const normalized = slug.toLowerCase()
  const matched = stockImages.filter((image) => image.categorySlugs.includes(normalized))

  return matched.length > 0 ? matched : stockImages
}

const toAbsoluteStockUrl = (path: string) => `${window.location.origin}${path}`

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
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([])
  const [selectedStockImageIds, setSelectedStockImageIds] = useState<string[]>([])

  const schema = z.object({
    categoryId: z.string().min(1, t('selectCategory')),
    title: z.string().min(5, t('min5')).max(200),
    description: z.string().min(20, t('min20')),
    price: z.number({ error: t('priceRequired') }).min(0, t('priceNotNegative')),
    stockQuantity: z.number({ error: t('stockRequired') }).int(t('integerOnly')).min(1, t('minOneItem')),
    deliveryInfo: z.string().optional(),
    tags: z.string().optional(),
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '', title: '', description: '', price: 0, stockQuantity: 1, deliveryInfo: '', tags: '' },
  })

  const selectedCategoryId = watch('categoryId')
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )
  const visibleStockImages = useMemo(
    () => getStockImagesForCategory(selectedCategory?.slug),
    [selectedCategory?.slug]
  )

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
    const urls = files.map((file) => URL.createObjectURL(file))
    setFilePreviewUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  const addImageFiles = (incomingFiles: File[]) => {
    const imageFiles = incomingFiles.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return false

    setFiles((current) => {
      const slotsLeft = Math.max(6 - current.length, 0)
      if (slotsLeft === 0) return current
      return [...current, ...imageFiles.slice(0, slotsLeft)]
    })
    return true
  }

  const selectFiles = (selected: FileList | null) => {
    addImageFiles(Array.from(selected ?? []))
  }

  const removeImageFile = (indexToRemove: number) => {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove))
  }

  const handlePasteImages = (clipboardData: DataTransfer) => {
    const pastedFiles = Array.from(clipboardData.files)
    const added = addImageFiles(pastedFiles)
    if (added) setError('')
    return added
  }

  useEffect(() => {
    const handleWindowPaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) return
      const hasImage = Array.from(event.clipboardData.files).some((file) => file.type.startsWith('image/'))
      if (!hasImage) return

      event.preventDefault()
      handlePasteImages(event.clipboardData)
    }

    window.addEventListener('paste', handleWindowPaste)
    return () => window.removeEventListener('paste', handleWindowPaste)
  }, [])

  const toggleStockImage = (imageId: string) => {
    setSelectedStockImageIds((current) =>
      current.includes(imageId)
        ? current.filter((id) => id !== imageId)
        : [...current, imageId].slice(0, 6)
    )
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

      const listingWithUploads = files.length > 0
        ? (await listingsApi.uploadImages(listing.id, files)).data
        : listing
      const selectedStockUrls = stockImages
        .filter((image) => selectedStockImageIds.includes(image.id))
        .map((image) => toAbsoluteStockUrl(image.path))
      const finalListing = selectedStockUrls.length > 0
        ? (await listingsApi.addImageUrls(listingWithUploads.id, selectedStockUrls)).data
        : listingWithUploads

      if (isEditMode) {
        navigate(`/listing/${finalListing.id}`)
      } else {
        navigate(`/my-listings/submitted/${finalListing.id}`, {
          state: {
            title: finalListing.title,
            status: finalListing.status,
          },
        })
      }
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

          <Paper
            variant="outlined"
            tabIndex={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.025)',
              outline: 'none',
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(101,212,110,0.12)',
              },
            }}
          >
            <Stack spacing={2}>
              {existingImages.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {existingImages.map((image) => (
                    <Box
                      key={image.id}
                      component="img"
                      src={listingImageUrl(image.url, selectedCategory?.name)}
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
                  {filePreviewUrls[0] ? (
                    <Box component="img" src={filePreviewUrls[0]} alt={t('preview')} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageOutlinedIcon color="primary" />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={800}>{t('addProductImages')}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('uploadImagesHint')}
                  </Typography>
                  <Typography variant="body2" color="primary.main" sx={{ mb: 1.5, fontWeight: 800 }}>
                    Можно вставить картинку из буфера через Ctrl+V. Она сразу появится в галерее ниже.
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

              {filePreviewUrls.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                  {filePreviewUrls.map((url, index) => (
                    <Box
                      key={`${files[index]?.name ?? 'pasted'}-${index}`}
                      sx={{
                        position: 'relative',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid rgba(101,212,110,0.28)',
                        bgcolor: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <Box
                        component="img"
                        src={url}
                        alt={`${t('image')} ${index + 1}`}
                        sx={{ display: 'block', width: '100%', aspectRatio: '16 / 10', objectFit: 'cover' }}
                      />
                      <Chip
                        size="small"
                        label={index === 0 ? 'Главная' : `#${index + 1}`}
                        sx={{ position: 'absolute', left: 8, bottom: 8, fontWeight: 900, bgcolor: 'rgba(10,14,18,0.8)', color: '#fff' }}
                      />
                      <IconButton
                        size="small"
                        aria-label="Удалить картинку"
                        onClick={() => removeImageFile(index)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: '#fff',
                          bgcolor: 'rgba(10,14,18,0.72)',
                          border: '1px solid rgba(255,255,255,0.18)',
                          '&:hover': {
                            bgcolor: 'rgba(255,82,82,0.85)',
                          },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              <Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography fontWeight={900}>Стоковая галерея</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Если нет своей картинки, выберите готовую обложку под категорию объявления.
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={selectedStockImageIds.length > 0 ? 'primary' : 'default'}
                    label={`Выбрано: ${selectedStockImageIds.length}`}
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
                    gap: 1.25,
                  }}
                >
                  {visibleStockImages.map((image) => {
                    const selected = selectedStockImageIds.includes(image.id)
                    return (
                      <Box
                        key={image.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleStockImage(image.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            toggleStockImage(image.id)
                          }
                        }}
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: selected ? '2px solid #52e26f' : '1px solid rgba(255,255,255,0.1)',
                          bgcolor: 'rgba(255,255,255,0.04)',
                          boxShadow: selected ? '0 0 0 4px rgba(82,226,111,0.14)' : 'none',
                          transition: 'transform .18s ease, border-color .18s ease, box-shadow .18s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: selected ? '#52e26f' : 'rgba(82,226,111,0.5)',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={image.path}
                          alt={image.label}
                          sx={{ display: 'block', width: '100%', aspectRatio: '16 / 10', objectFit: 'cover' }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 10,
                            right: 10,
                            bottom: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Chip size="small" label={image.label} sx={{ fontWeight: 900, bgcolor: 'rgba(10,14,18,0.78)', color: '#fff' }} />
                          {selected && <Chip size="small" color="primary" label="Выбрано" sx={{ fontWeight: 900 }} />}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
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
