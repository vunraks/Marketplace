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
import { assetUrl, getErrorMessage } from '../utils/format'

const schema = z.object({
  categoryId: z.string().min(1, 'Выберите категорию'),
  title: z.string().min(5, 'Минимум 5 символов').max(200),
  description: z.string().min(20, 'Минимум 20 символов'),
  price: z.number({ error: 'Укажите цену' }).min(0, 'Цена не может быть отрицательной'),
  stockQuantity: z.number({ error: 'Укажите количество' }).int('Только целое число').min(1, 'Минимум 1 шт.'),
  deliveryInfo: z.string().optional(),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function flattenCategories(cats: CategoryTree[]): CategoryTree[] {
  return cats.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
}

export default function CreateListingPage() {
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '', title: '', description: '', price: 0, stockQuantity: 1, deliveryInfo: '', tags: '' },
  })

  useEffect(() => {
    categoriesApi
      .getTree()
      .then((response) => setCategories(flattenCategories(Array.isArray(response.data) ? response.data : [])))
      .catch(() => setError('Не удалось загрузить категории'))
  }, [])

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
      .catch((e) => setError(getErrorMessage(e, 'Не удалось загрузить объявление')))
      .finally(() => setLoading(false))
  }, [id, reset])

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
      setError(getErrorMessage(e, isEditMode ? 'Не удалось сохранить объявление' : 'Не удалось создать объявление'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 4, maxWidth: 760, mx: 'auto' }}>
        <Typography>Загрузка объявления...</Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 760, mx: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        {isEditMode ? 'Редактировать объявление' : 'Новое объявление'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        После сохранения объявление снова попадет на модерацию.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField select fullWidth label="Категория" {...register('categoryId')} error={!!errors.categoryId} helperText={errors.categoryId?.message}>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Название" {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
          <TextField fullWidth label="Описание" multiline rows={7} {...register('description')} error={!!errors.description} helperText={errors.description?.message} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField fullWidth label="Цена за 1 шт. (VT)" type="number" {...register('price', { valueAsNumber: true })} error={!!errors.price} helperText={errors.price?.message} />
            <TextField fullWidth label="Количество, шт." type="number" {...register('stockQuantity', { valueAsNumber: true })} error={!!errors.stockQuantity} helperText={errors.stockQuantity?.message} />
          </Stack>
          <TextField fullWidth label="Информация о выдаче/доставке" {...register('deliveryInfo')} />
          <TextField fullWidth label="Теги через запятую" {...register('tags')} />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.025)' }}>
            <Stack spacing={2}>
              {existingImages.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {existingImages.map((image) => (
                    <Box key={image.id} component="img" src={assetUrl(image.url)} alt={image.altText ?? 'Изображение'} sx={{ width: 112, height: 82, objectFit: 'cover', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.1)' }} />
                  ))}
                </Box>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Box sx={{ width: { xs: '100%', sm: 180 }, aspectRatio: '16 / 10', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                  {previewUrl ? (
                    <Box component="img" src={previewUrl} alt="Превью" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageOutlinedIcon color="primary" />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={800}>Добавить картинки товара</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Можно загрузить до 6 новых изображений. Они добавятся к объявлению.
                  </Typography>
                  <Button component="label" variant="outlined" startIcon={<ImageOutlinedIcon />}>
                    Выбрать изображения
                    <input hidden type="file" accept="image/*" multiple onChange={(event) => selectFiles(event.target.files)} />
                  </Button>
                  {files.length > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Выбрано файлов: {files.length}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <Button type="submit" variant="contained" size="large" disabled={submitting} startIcon={<SaveOutlinedIcon />}>
            {submitting ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Отправить на модерацию'}
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
