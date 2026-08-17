import { useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import LockIcon from '@mui/icons-material/Lock'
import { Link as RouterLink } from 'react-router-dom'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Conversation } from '../types'
import { onConversationUpdated } from '../realtime/notificationHub'
import { useAppSelector } from '../store/hooks'
import { formatDateTime, getErrorMessage } from '../utils/format'

const emptyGuid = '00000000-0000-0000-0000-000000000000'

function isRealConversation(conversation: Conversation | null | undefined) {
  return Boolean(conversation?.id && conversation.id !== emptyGuid)
}

function otherParticipant(conversation: Conversation, userId?: string) {
  if (!userId) return conversation.participants[0]
  return conversation.participants.find((p) => p.userId.toLowerCase() !== userId.toLowerCase())
}

function upsertConversation(items: Conversation[], next: Conversation) {
  if (!isRealConversation(next)) return items
  const index = items.findIndex((item) => item.id === next.id)
  if (index === -1) return [next, ...items]
  const copy = [...items]
  copy[index] = next
  return [next, ...copy.filter((_, i) => i !== index)]
}

export default function ChatsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    commerceApi.getConversations()
      .then((r) => {
        setConversations(r.data)
        setActive((current) => {
          if (!current) return r.data[0] ?? null
          return r.data.find((item) => item.id === current.id) ?? current
        })
      })
      .catch((e) => setError(getErrorMessage(e, 'Не удалось загрузить чаты')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    commerceApi.markNotificationsRead().catch(() => undefined)
  }, [])

  useEffect(() => {
    return onConversationUpdated((conversation) => {
      setConversations((items) => upsertConversation(items, conversation))
      setActive((current) => (current?.id === conversation.id ? conversation : current))
    })
  }, [])

  const send = async () => {
    if (!isRealConversation(active) || active?.isClosed || !message.trim()) return
    setBusy(true)
    setError('')
    try {
      const { data } = await commerceApi.sendConversationMessage(active!.id, message)
      setActive(data)
      setConversations((items) => upsertConversation(items, data))
      setMessage('')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось отправить сообщение'))
    } finally {
      setBusy(false)
    }
  }

  const closeChat = async () => {
    if (!isRealConversation(active)) return
    setBusy(true)
    setError('')
    try {
      const { data } = await commerceApi.closeConversation(active!.id)
      setActive(data)
      setConversations((items) => upsertConversation(items, data))
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось закрыть чат'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const activeOther = active ? otherParticipant(active, user?.id) : undefined
  const canCloseActive = Boolean(active && !active.isClosed && active.sellerId?.toLowerCase() === user?.id?.toLowerCase())

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>Чаты</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2, alignItems: 'stretch' }}>
        <Paper sx={{ p: 1.5, height: { md: 560 }, overflow: 'auto' }}>
          {conversations.length === 0 ? (
            <Typography color="text.secondary">Пока нет диалогов</Typography>
          ) : (
            <Stack spacing={1}>
              {conversations.map((conversation) => {
                const other = otherParticipant(conversation, user?.id)
                const last = conversation.messages.at(-1)
                return (
                  <Button
                    key={conversation.id}
                    onClick={() => setActive(conversation)}
                    variant={active?.id === conversation.id ? 'contained' : 'outlined'}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', display: 'block' }}
                  >
                    <Typography fontWeight={800} noWrap>
                      {conversation.listingTitle || 'Товар'}
                    </Typography>
                    <Typography variant="caption" color={active?.id === conversation.id ? 'inherit' : 'text.secondary'} noWrap display="block">
                      {other?.username || 'Собеседник'}
                    </Typography>
                    <Typography variant="caption" color={active?.id === conversation.id ? 'inherit' : 'text.secondary'} noWrap display="block">
                      Открыт: {formatDateTime(conversation.openedAt)}
                    </Typography>
                    <Typography variant="caption" color={active?.id === conversation.id ? 'inherit' : 'text.secondary'} noWrap display="block">
                      {last?.content || 'Нет сообщений'}
                    </Typography>
                    {conversation.isClosed && <Chip label="Закрыт" size="small" sx={{ mt: 0.75 }} />}
                  </Button>
                )
              })}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ height: { xs: 520, md: 560 }, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {active ? (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box>
                    <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                      {active.listingTitle || 'Товар'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activeOther?.username || 'Собеседник'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Открыт: {formatDateTime(active.openedAt)}
                    </Typography>
                    {active.closedAt && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Закрыт: {formatDateTime(active.closedAt)}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <Chip label={active.isClosed ? 'Закрыт' : 'Открыт'} color={active.isClosed ? 'default' : 'success'} size="small" />
                    {active.listingId && (
                      <Button component={RouterLink} to={`/listing/${active.listingId}`} size="small">
                        Открыть товар
                      </Button>
                    )}
                    {canCloseActive && (
                      <Button size="small" color="warning" variant="outlined" startIcon={<LockIcon />} disabled={busy} onClick={closeChat}>
                        Завершить чат
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
              <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0, p: 2, overflow: 'auto' }}>
                {active.messages.length === 0 ? (
                  <Typography color="text.secondary">Напишите первое сообщение</Typography>
                ) : active.messages.map((item) => {
                  const mine = item.senderId.toLowerCase() === user?.id?.toLowerCase()
                  return (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{ maxWidth: '78%', p: 1.25, borderRadius: 2, bgcolor: mine ? 'rgba(101,212,110,0.16)' : 'rgba(255,255,255,0.06)' }}>
                        <Typography variant="caption" color="text.secondary">{item.senderUsername} · {formatDateTime(item.createdAt)}</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{item.content}</Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
              <Box sx={{ p: 1.5, display: 'flex', gap: 1, borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <TextField
                  fullWidth
                  placeholder={active.isClosed ? 'Чат закрыт продавцом' : 'Написать...'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={active.isClosed}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                />
                <Button variant="contained" onClick={send} disabled={busy || active.isClosed || !message.trim()}>
                  <SendIcon />
                </Button>
              </Box>
              {active.isClosed && (
                <Alert severity="info" icon={<LockIcon />} sx={{ borderRadius: 0 }}>
                  Чат закрыт продавцом. Если покупатель снова купит этот товар, чат откроется автоматически.
                </Alert>
              )}
            </>
          ) : (
            <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Выберите диалог</Typography>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
