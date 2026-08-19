import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined'
import LockIcon from '@mui/icons-material/Lock'
import SendIcon from '@mui/icons-material/Send'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { onConversationUpdated } from '../realtime/notificationHub'
import { useAppSelector } from '../store/hooks'
import type { Conversation } from '../types'
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
  const isStaff = user?.roles.some((role) => role === 'Admin' || role === 'Moderator')
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
          return r.data.find((item) => item.id === current.id) ?? r.data[0] ?? null
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
      const includesCurrentUser = conversation.participants.some((participant) =>
        participant.userId.toLowerCase() === user?.id?.toLowerCase()
      )

      if (!includesCurrentUser) {
        setConversations((items) => items.filter((item) => item.id !== conversation.id))
        setActive((current) => (current?.id === conversation.id ? null : current))
        return
      }

      setConversations((items) => upsertConversation(items, conversation))
      setActive((current) => (current?.id === conversation.id ? conversation : current))
    })
  }, [user?.id])

  const send = async () => {
    const content = message.trim()
    if (!content || active?.isClosed) return

    setBusy(true)
    setError('')
    try {
      const { data } = active?.isSupport && !isRealConversation(active)
        ? await commerceApi.sendSupportMessage(content)
        : await commerceApi.sendConversationMessage(active!.id, content)
      setActive(data)
      setConversations((items) => upsertConversation(items, data))
      setMessage('')
    } catch (e) {
      const errorMessage = getErrorMessage(e, active?.isSupport ? 'Не удалось отправить сообщение в поддержку' : 'Не удалось отправить сообщение')
      if (errorMessage.includes('not a participant') && active) {
        const nextItems = conversations.filter((item) => item.id !== active.id)
        setConversations(nextItems)
        setActive(nextItems[0] ?? null)
        setMessage('')
      }
      setError(errorMessage)
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

  const deleteChat = async () => {
    if (!isRealConversation(active)) return
    const deleteId = active!.id
    setBusy(true)
    setError('')
    try {
      await commerceApi.deleteConversation(deleteId)
      const { data: nextItems } = await commerceApi.getConversations()
      setConversations(nextItems)
      setActive(nextItems[0] ?? null)
      setMessage('')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось удалить чат'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const activeOther = active ? otherParticipant(active, user?.id) : undefined
  const canCloseActive = Boolean(active && !active.isClosed && (
    active.sellerId?.toLowerCase() === user?.id?.toLowerCase() ||
    (active.isSupport && isStaff)
  ))

  return (
    <Box>
      <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>Чаты</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2, alignItems: 'stretch' }}>
        <Paper sx={{ p: 1.5, height: { xs: 620, md: 'min(760px, calc(100vh - 180px))' }, minHeight: { md: 680 }, overflow: 'auto' }}>
          {conversations.length === 0 ? (
            <Typography color="text.secondary">Пока нет диалогов</Typography>
          ) : (
            <Stack spacing={1}>
              {conversations.map((conversation) => {
                const other = otherParticipant(conversation, user?.id)
                const last = conversation.messages.at(-1)
                const isActive = active?.id === conversation.id
                return (
                  <Button
                    key={conversation.id}
                    onClick={() => {
                      setActive(conversation)
                      setError('')
                    }}
                    variant={isActive ? 'contained' : 'outlined'}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', display: 'block' }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {conversation.isSupport && <HeadsetMicOutlinedIcon fontSize="small" />}
                      <Typography fontWeight={900} noWrap>
                        {conversation.isSupport ? 'Поддержка VaultTrade' : conversation.listingTitle || 'Товар'}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color={isActive ? 'inherit' : 'text.secondary'} noWrap display="block">
                      {conversation.isSupport ? other?.username || 'Пользователь' : other?.username || 'Собеседник'}
                    </Typography>
                    <Typography variant="caption" color={isActive ? 'inherit' : 'text.secondary'} noWrap display="block">
                      Открыт: {formatDateTime(conversation.openedAt)}
                    </Typography>
                    <Typography variant="caption" color={isActive ? 'inherit' : 'text.secondary'} noWrap display="block">
                      {last?.content || 'Нет сообщений'}
                    </Typography>
                    {conversation.isClosed && <Chip label="Закрыт" size="small" sx={{ mt: 0.75 }} />}
                  </Button>
                )
              })}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ height: { xs: 620, md: 'min(760px, calc(100vh - 180px))' }, minHeight: { md: 680 }, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {active ? (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                      {active.isSupport && <HeadsetMicOutlinedIcon color="primary" />}
                      <Typography fontWeight={900}>
                        {active.isSupport ? 'Поддержка VaultTrade' : active.listingTitle || 'Товар'}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {active.isSupport ? activeOther?.username || 'Пользователь' : activeOther?.username || 'Собеседник'}
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
                    {isRealConversation(active) && active.isClosed && (
                      <Button size="small" color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} disabled={busy} onClick={deleteChat}>
                        Удалить
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
                      <Box sx={{ maxWidth: '78%', p: 1.25, borderRadius: 2, bgcolor: mine ? 'rgba(101,212,110,0.18)' : 'rgba(255,255,255,0.07)', overflowWrap: 'anywhere' }}>
                        <Typography variant="caption" color="text.secondary">{item.senderUsername} · {formatDateTime(item.createdAt)}</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.content}</Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>

              <Box sx={{ p: 1.5, display: 'flex', gap: 1, borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={5}
                  placeholder={active.isClosed ? 'Чат закрыт' : 'Написать...'}
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
                <Button variant="contained" onClick={send} disabled={busy || active.isClosed || !message.trim()} sx={{ alignSelf: 'flex-end', minHeight: 56, minWidth: 56 }}>
                  <SendIcon />
                </Button>
              </Box>

              {active.isClosed && (
                <Alert severity="info" icon={<LockIcon />} sx={{ borderRadius: 0 }}>
                  {active.isSupport
                    ? 'Обращение закрыто поддержкой. Если потребуется, пользователь может написать новое сообщение.'
                    : 'Чат закрыт продавцом. Если покупатель снова купит этот товар, чат откроется автоматически.'}
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
