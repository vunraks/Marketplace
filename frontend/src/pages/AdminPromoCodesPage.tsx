import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import { promoCodesApi } from '../api/promoCodesApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { PromoCode } from '../types'
import { formatDate, getErrorMessage } from '../utils/format'

const emptyForm = {
  code: '',
  bonusAmount: '1000',
  maxRedemptions: '',
  expiresAt: '',
  description: '',
}

export default function AdminPromoCodesPage() {
  const [items, setItems] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    setLoading(true)
    setError('')
    promoCodesApi.getAll()
      .then((r) => setItems(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Не удалось загрузить промокоды')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    const code = form.code.trim()
    const bonusAmount = Number(form.bonusAmount.replace(',', '.'))
    const maxRaw = form.maxRedemptions.trim()
    const maxRedemptions = maxRaw ? Number(maxRaw) : null

    if (code.length < 3) {
      setError('Код должен содержать минимум 3 символа.')
      return
    }
    if (!Number.isFinite(bonusAmount) || bonusAmount <= 0) {
      setError('Бонус должен быть больше нуля.')
      return
    }
    if (maxRedemptions !== null && (!Number.isFinite(maxRedemptions) || maxRedemptions <= 0)) {
      setError('Лимит активаций должен быть больше нуля.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data } = await promoCodesApi.create({
        code,
        bonusAmount,
        maxRedemptions,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        description: form.description.trim() || undefined,
      })
      setItems((current) => [data, ...current])
      setForm(emptyForm)
      setNotice(`Промокод ${data.code} создан`)
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось создать промокод'))
    } finally {
      setBusy(false)
    }
  }

  const disable = async (promo: PromoCode) => {
    setProcessingId(promo.id)
    setError('')
    setNotice('')
    try {
      const { data } = await promoCodesApi.disable(promo.id)
      setItems((current) => current.map((item) => item.id === data.id ? data : item))
      setNotice(`Промокод ${data.code} отключён`)
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось отключить промокод'))
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalOfferOutlinedIcon color="primary" />
            <Typography variant="h4" fontWeight={800}>Промокоды</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Создавайте бонусные коды и начисляйте виртуальную валюту пользователям.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={items.length} color="primary" variant="outlined" />
          <Button variant="outlined" onClick={load}>Обновить</Button>
        </Stack>
      </Box>

      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Typography fontWeight={800} sx={{ mb: 2 }}>Новый промокод</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr 0.8fr 1fr' }, gap: 1.5 }}>
          <TextField
            label="Код"
            value={form.code}
            onChange={(e) => setForm((current) => ({ ...current, code: e.target.value.toUpperCase() }))}
            placeholder="WELCOME1000"
          />
          <TextField
            label="Бонус VT"
            type="number"
            value={form.bonusAmount}
            onChange={(e) => setForm((current) => ({ ...current, bonusAmount: e.target.value }))}
            inputProps={{ min: 1, step: 1 }}
          />
          <TextField
            label="Лимит активаций"
            type="number"
            value={form.maxRedemptions}
            onChange={(e) => setForm((current) => ({ ...current, maxRedemptions: e.target.value }))}
            placeholder="Без лимита"
            inputProps={{ min: 1, step: 1 }}
          />
          <TextField
            label="Действует до"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm((current) => ({ ...current, expiresAt: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <TextField
          fullWidth
          label="Описание"
          value={form.description}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          sx={{ mt: 1.5 }}
          placeholder="Бонус за регистрацию"
        />
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="contained" disabled={busy} onClick={create}>Создать</Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Код</TableCell>
              <TableCell>Бонус</TableCell>
              <TableCell>Использования</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Срок</TableCell>
              <TableCell>Создан</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary">Промокодов пока нет</Typography>
                </TableCell>
              </TableRow>
            ) : items.map((promo) => {
              const expired = Boolean(promo.expiresAt && new Date(promo.expiresAt) <= new Date())
              const exhausted = promo.maxRedemptions != null && promo.redeemedCount >= promo.maxRedemptions
              return (
                <TableRow key={promo.id} hover>
                  <TableCell>
                    <Typography fontWeight={800}>{promo.code}</Typography>
                    {promo.description && (
                      <Typography variant="body2" color="text.secondary">{promo.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={800}>{promo.bonusAmount.toLocaleString('ru-RU')} VT</Typography>
                  </TableCell>
                  <TableCell>
                    {promo.redeemedCount}
                    {promo.maxRedemptions != null ? ` / ${promo.maxRedemptions}` : ' / ∞'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      <Chip
                        label={promo.isActive ? 'Активен' : 'Отключён'}
                        size="small"
                        color={promo.isActive ? 'success' : 'default'}
                      />
                      {expired && <Chip label="Истёк" size="small" color="warning" />}
                      {exhausted && <Chip label="Лимит" size="small" color="warning" />}
                    </Stack>
                  </TableCell>
                  <TableCell>{promo.expiresAt ? formatDate(promo.expiresAt) : 'Без срока'}</TableCell>
                  <TableCell>{formatDate(promo.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={!promo.isActive || processingId === promo.id}
                      onClick={() => disable(promo)}
                    >
                      Отключить
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
