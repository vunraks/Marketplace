import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Box, Typography, TextField, Button, MenuItem, Alert, Paper, Stack } from '@mui/material'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { useNavigate } from 'react-router-dom'
import { categoriesApi } from '../api/categoriesApi'
import { listingsApi } from '../api/listingsApi'
import type { CategoryTree } from '../types'
import { getErrorMessage } from '../utils/format'

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
  return cats.flatMap((c) => [c, ...flattenCategories(c.children ?? [])])
}

export default function CreateListingPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, stockQuantity: 1 },
  })

  useEffect(() => {
    categoriesApi.getTree().then((r) => setCategories(flattenCategories(r.data)))
  }, [])

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
      const tags = data.tags?.split(',').map((t) => t.trim()).filter(Boolean)
      const { data: listing } = await listingsApi.create({
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        price: data.price,
        stockQuantity: data.stockQuantity,
        deliveryInfo: data.deliveryInfo,
        tags,
      })
      const finalListing = files.length > 0
        ? (await listingsApi.uploadImages(listing.id, files)).data
        : listing
      navigate(`/listing/${finalListing.id}`)
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось создать объявление'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Paper sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 760, mx: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Новое объявление</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Укажите цену за 1 штуку и общий остаток товара.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField select fullWidth label="Категория" {...register('categoryId')} error={!!errors.categoryId} helperText={errors.categoryId?.message}>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Box sx={{ width: { xs: '100%', sm: 180 }, aspectRatio: '16 / 10', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                {previewUrl ? (
                  <Box component="img" src={previewUrl} alt="Превью" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageOutlinedIcon color="primary" />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800}>Картинка товара</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Первая выбранная картинка станет обложкой и будет отображаться в каталоге и на странице товара.
                </Typography>
                <Button component="label" variant="outlined" startIcon={<ImageOutlinedIcon />}>
                  Выбрать изображения
                  <input hidden type="file" accept="image/*" multiple onChange={(e) => selectFiles(e.target.files)} />
                </Button>
                {files.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Выбрано файлов: {files.length}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? 'Сохранение...' : 'Отправить на модерацию'}
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
