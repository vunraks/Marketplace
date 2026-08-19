import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined'
import SendIcon from '@mui/icons-material/Send'
import { commerceApi } from '../../api/commerceApi'
import { onConversationUpdated } from '../../realtime/notificationHub'
import { useAppSelector } from '../../store/hooks'
import type { Conversation } from '../../types'
import { formatDateTime, getErrorMessage } from '../../utils/format'

const emptyGuid = '00000000-0000-0000-0000-000000000000'

const isRealConversation = (conversation?: Conversation | null) =>
  Boolean(conversation?.id && conversation.id !== emptyGuid)

export default function SupportChatWidget() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const isStaff = user?.roles.some((role) => role === 'Admin' || role === 'Moderator')
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated || isStaff) return

    return onConversationUpdated((next) => {
      if (next.isSupport) setConversation(next)
    })
  }, [isAuthenticated, isStaff])

  if (!isAuthenticated || isStaff) return null

  const loadSupport = async () => {
    setOpen(true)
    if (conversation) return

    setBusy(true)
    setError('')
    try {
      const { data } = await commerceApi.getSupportConversation()
      setConversation(data)
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось открыть поддержку'))
    } finally {
      setBusy(false)
    }
  }

  const send = async () => {
    const content = message.trim()
    if (!content || conversation?.isClosed) return

    setBusy(true)
    setError('')
    try {
      const { data } = await commerceApi.sendSupportMessage(content)
      setConversation(data)
      setMessage('')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось отправить сообщение'))
    } finally {
      setBusy(false)
    }
  }

  const startNewConversation = () => {
    setConversation(null)
    setMessage('')
    setError('')
  }

  return (
    <Box sx={{ position: 'fixed', right: { xs: 14, sm: 22 }, bottom: { xs: 14, sm: 22 }, zIndex: 1250 }}>
      {!open ? (
        <Badge color="warning" variant={isRealConversation(conversation) && !conversation?.isClosed ? 'dot' : 'standard'}>
          <Button
            variant="contained"
            startIcon={<HeadsetMicOutlinedIcon />}
            onClick={loadSupport}
            sx={{
              minHeight: 50,
              px: 2.25,
              borderRadius: 999,
              boxShadow: '0 18px 50px rgba(0,0,0,0.36)',
              fontWeight: 900,
            }}
          >
            Поддержка
          </Button>
        </Badge>
      ) : (
        <Paper
          sx={{
            width: { xs: 'calc(100vw - 28px)', sm: 390 },
            height: 540,
            maxHeight: 'calc(100vh - 36px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
            border: '1px solid rgba(82,226,111,0.22)',
            boxShadow: '0 22px 70px rgba(0,0,0,0.46)',
          }}
        >
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              bgcolor: 'rgba(82,226,111,0.12)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.main', color: '#07100b', fontWeight: 950 }}>
              <HeadsetMicOutlinedIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={950}>Поддержка VaultTrade</Typography>
              <Typography variant="caption" color="text.secondary">
                Админы и модераторы увидят сообщение в чатах
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={1.1} sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1.5 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {busy && !conversation && <Typography color="text.secondary">Открываем чат...</Typography>}
            {conversation?.messages.length ? (
              conversation.messages.map((item) => {
                const mine = item.senderId.toLowerCase() === user?.id.toLowerCase()
                return (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <Box
                      sx={{
                        maxWidth: '82%',
                        px: 1.4,
                        py: 1,
                        borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        bgcolor: mine ? 'primary.main' : 'rgba(255,255,255,0.08)',
                        color: mine ? '#07100b' : 'text.primary',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        {item.senderUsername} · {formatDateTime(item.createdAt)}
                      </Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{item.content}</Typography>
                    </Box>
                  </Box>
                )
              })
            ) : (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
                <Typography fontWeight={900}>Напишите вопрос</Typography>
                <Typography color="text.secondary" variant="body2">
                  Например: проблема с заказом, пополнением, продавцом или объявлением.
                </Typography>
              </Box>
            )}
          </Stack>

          {conversation?.isClosed && (
            <Box sx={{ px: 1.25, pt: 1.25 }}>
              <Alert
                severity="info"
                action={
                  <Button color="inherit" size="small" onClick={startNewConversation}>
                    Новое обращение
                  </Button>
                }
                sx={{ alignItems: 'center' }}
              >
                Чат закрыт поддержкой. Можно открыть новое обращение.
              </Alert>
            </Box>
          )}

          <Box sx={{ p: 1.25, display: 'flex', gap: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              placeholder={conversation?.isClosed ? 'Чат закрыт поддержкой' : 'Введите сообщение...'}
              value={message}
              disabled={conversation?.isClosed}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
            />
            <Button
              variant="contained"
              onClick={send}
              disabled={busy || conversation?.isClosed || !message.trim()}
              sx={{ minWidth: 54, alignSelf: 'flex-end', minHeight: 54 }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
