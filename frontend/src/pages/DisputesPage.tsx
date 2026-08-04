import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Dispute } from '../types'
import { formatDate, getErrorMessage } from '../utils/format'
import { useAppSelector } from '../store/hooks'

type Resolution = 'refund' | 'complete' | 'reject'

export default function DisputesPage() {
  const { user } = useAppSelector((s) => s.auth)
  const [mine, setMine] = useState<Dispute[]>([])
  const [admin, setAdmin] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [noteById, setNoteById] = useState<Record<string, string>>({})
  const [resolutionById, setResolutionById] = useState<Record<string, Resolution>>({})

  const isModerator = user?.roles.some((role) => role === 'Moderator' || role === 'Admin')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const mineResponse = await commerceApi.getMyDisputes()
      setMine(mineResponse.data)

      if (isModerator) {
        const adminResponse = await commerceApi.getAdminDisputes()
        setAdmin(adminResponse.data)
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось загрузить споры'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [isModerator])

  const resolve = async (dispute: Dispute) => {
    const resolution = resolutionById[dispute.id] ?? 'refund'
    setBusyId(dispute.id)
    setError('')
    setNotice('')

    try {
      await commerceApi.resolveDispute(dispute.id, resolution, noteById[dispute.id])
      setNotice('Спор закрыт')
      await load()
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось закрыть спор'))
    } finally {
      setBusyId(null)
    }
  }

  const renderDispute = (dispute: Dispute, canResolve: boolean) => (
    <Paper key={dispute.id} sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} sx={{ wordBreak: 'break-word' }}>
              {dispute.listingTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Заказ {dispute.orderNumber} · {formatDate(dispute.createdAt)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label={dispute.status} color={dispute.status === 'New' ? 'warning' : 'default'} />
            <Chip label={`Заказ: ${dispute.orderStatus}`} variant="outlined" />
          </Stack>
        </Box>

        <Box>
          <Typography fontWeight={700}>{dispute.reason}</Typography>
          {dispute.description && <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>{dispute.description}</Typography>}
        </Box>

        <Typography variant="body2" color="text.secondary">
          Покупатель: {dispute.buyerUsername} · Продавец: {dispute.sellerUsername} · Открыл: {dispute.reporterUsername}
        </Typography>

        {dispute.resolutionNote && (
          <Alert severity={dispute.status === 'Rejected' ? 'info' : 'success'}>{dispute.resolutionNote}</Alert>
        )}

        {canResolve && (dispute.status === 'New' || dispute.status === 'InReview') && (
          <>
            <Divider />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
              <TextField
                select
                label="Решение"
                value={resolutionById[dispute.id] ?? 'refund'}
                onChange={(e) => setResolutionById((current) => ({ ...current, [dispute.id]: e.target.value as Resolution }))}
                sx={{ minWidth: 210 }}
              >
                <MenuItem value="refund">Вернуть товар в продажу</MenuItem>
                <MenuItem value="complete">Завершить в пользу продавца</MenuItem>
                <MenuItem value="reject">Отклонить спор</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Комментарий"
                value={noteById[dispute.id] ?? ''}
                onChange={(e) => setNoteById((current) => ({ ...current, [dispute.id]: e.target.value }))}
              />
              <Button variant="contained" disabled={busyId === dispute.id} onClick={() => resolve(dispute)}>
                Закрыть
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  )

  if (loading) return <LoadingSpinner />

  const visibleAdminDisputes = admin.length ? admin : mine

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <ReportProblemOutlinedIcon color="primary" />
        <Box>
          <Typography variant="h4" fontWeight={900}>Споры</Typography>
          <Typography color="text.secondary">Открытые вопросы по заказам и решения модерации.</Typography>
        </Box>
      </Box>

      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isModerator ? (
        <Stack spacing={2}>
          <Box className="section-title-row">
            <Typography variant="h6">Очередь модерации</Typography>
            <Chip label={visibleAdminDisputes.length} color={visibleAdminDisputes.length ? 'warning' : 'success'} />
          </Box>
          {visibleAdminDisputes.length === 0 ? (
            <Alert severity="success">Открытых споров нет</Alert>
          ) : (
            visibleAdminDisputes.map((dispute) => renderDispute(dispute, true))
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>
          {mine.length === 0 ? (
            <Alert severity="info">У вас пока нет споров</Alert>
          ) : (
            mine.map((dispute) => renderDispute(dispute, false))
          )}
        </Stack>
      )}
    </Box>
  )
}
