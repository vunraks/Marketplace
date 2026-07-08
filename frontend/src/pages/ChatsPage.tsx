import { useEffect, useState } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { Link as RouterLink } from 'react-router-dom'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Conversation } from '../types'
import { useAppSelector } from '../store/hooks'
import { formatDate, getErrorMessage } from '../utils/format'

export default function ChatsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    commerceApi.getConversations()
      .then((r) => {
        setConversations(r.data)
        setActive((current) => current ?? r.data[0] ?? null)
      })
      .catch((e) => setError(getErrorMessage(e, 'Не удалось загрузить чаты')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    commerceApi.markNotificationsRead().catch(() => undefined)
  }, [])

  const send = async () => {
    if (!active?.listingId || !message.trim()) return
    try {
      const { data } = await commerceApi.sendListingMessage(active.listingId, message)
      setActive(data)
      setConversations((items) => items.map((item) => item.id === data.id ? data : item))
      setMessage('')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось отправить сообщение'))
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>Чаты</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 1.5, minHeight: 480 }}>
          {conversations.length === 0 ? (
            <Typography color="text.secondary">Пока нет диалогов</Typography>
          ) : (
            <Stack spacing={1}>
              {conversations.map((conversation) => {
                const other = conversation.participants.find((p) => p.userId !== user?.id)
                const last = conversation.messages.at(-1)
                return (
                  <Button
                    key={conversation.id}
                    onClick={() => setActive(conversation)}
                    variant={active?.id === conversation.id ? 'contained' : 'outlined'}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', display: 'block' }}
                  >
                    <Typography fontWeight={800}>{other?.username || 'Диалог'}</Typography>
                    <Typography variant="caption" color={active?.id === conversation.id ? 'inherit' : 'text.secondary'} noWrap>
                      {last?.content || 'Нет сообщений'}
                    </Typography>
                  </Button>
                )
              })}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ minHeight: 480, display: 'flex', flexDirection: 'column' }}>
          {active ? (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Button component={RouterLink} to={`/listing/${active.listingId}`} size="small">Открыть товар</Button>
              </Box>
              <Stack spacing={1.25} sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                {active.messages.map((item) => {
                  const mine = item.senderId === user?.id
                  return (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{ maxWidth: '78%', p: 1.25, borderRadius: 2, bgcolor: mine ? 'rgba(101,212,110,0.16)' : 'rgba(255,255,255,0.06)' }}>
                        <Typography variant="caption" color="text.secondary">{item.senderUsername} · {formatDate(item.createdAt)}</Typography>
                        <Typography>{item.content}</Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
              <Box sx={{ p: 1.5, display: 'flex', gap: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <TextField fullWidth placeholder="Написать..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} />
                <Button variant="contained" onClick={send} disabled={!message.trim()}><SendIcon /></Button>
              </Box>
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
