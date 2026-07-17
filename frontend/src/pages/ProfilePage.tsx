import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { commerceApi } from '../api/commerceApi'
import { usersApi } from '../api/usersApi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchProfile } from '../store/authSlice'
import type { ProfilePost } from '../types'
import { formatDate, getErrorMessage } from '../utils/format'

const statItems = [
  ['0', 'симпатий'],
  ['0', 'лайков'],
  ['0', 'сообщений'],
  ['0', 'трофеев'],
  ['0', 'подписок'],
]

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { profile, user } = useAppSelector((s) => s.auth)
  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [postText, setPostText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    dispatch(fetchProfile())
  }, [dispatch])

  useEffect(() => {
    usersApi.getMyPosts()
      .then((r) => setPosts(r.data))
      .catch(() => undefined)
  }, [])

  if (!profile) return null

  const isAdmin = user?.roles.includes('Admin') ?? profile.roles.includes('Admin')
  const initials = profile.username.slice(0, 2).toUpperCase()
  const joinedAt = formatDate(profile.createdAt)
  const primaryRole = profile.roles.includes('Admin')
    ? 'Администратор'
    : profile.roles.includes('Moderator')
      ? 'Модератор'
      : profile.roles.includes('Seller')
        ? 'Продавец'
        : 'Пользователь'

  const editProfile = async () => {
    const nextBio = window.prompt('Заметка о пользователе', profile.bio ?? '')
    if (nextBio === null) return

    setBusy(true)
    setError('')
    try {
      await usersApi.updateMe({ bio: nextBio.trim() })
      await dispatch(fetchProfile())
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось обновить профиль'))
    } finally {
      setBusy(false)
    }
  }

  const adjustMyWallet = async (direction: 'topup' | 'withdraw') => {
    if (!isAdmin) {
      setError('Пополнение и снятие виртуальной валюты доступны только администратору.')
      return
    }

    const raw = window.prompt(direction === 'topup' ? 'Сколько VT пополнить?' : 'Сколько VT снять?', '1000')
    if (raw === null) return

    const amount = Number(raw.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Введите положительную сумму.')
      return
    }

    setBusy(true)
    setError('')
    try {
      if (direction === 'topup') await commerceApi.topUpWallet(amount)
      else await commerceApi.withdrawWallet(amount)
      await dispatch(fetchProfile())
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось изменить баланс'))
    } finally {
      setBusy(false)
    }
  }

  const publishPost = async () => {
    const content = postText.trim()
    if (!content) return

    setBusy(true)
    setError('')
    try {
      const { data } = await usersApi.createMyPost(content)
      setPosts((current) => [data, ...current])
      setPostText('')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось опубликовать пост'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Форум / Пользователи / <Box component="span" sx={{ color: 'primary.main' }}>{profile.username}</Box>
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '230px 1fr' }, gap: 2 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Box sx={{ aspectRatio: '1 / 1', borderRadius: 1.5, bgcolor: '#080b0c', display: 'grid', placeItems: 'center', mb: 1.5, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Avatar src={profile.avatarUrl} sx={{ width: '68%', height: '68%', bgcolor: 'transparent', color: 'primary.main', fontSize: 74, fontWeight: 300 }}>
                {initials}
              </Avatar>
            </Box>
            <Button fullWidth variant="outlined" startIcon={<EditOutlinedIcon />} disabled={busy} onClick={editProfile}>Редактировать</Button>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography color="text.secondary" fontWeight={700}>Страховой депозит</Typography>
            <Typography fontWeight={800} sx={{ mt: 0.5 }}>{profile.username}</Typography>
            <Typography variant="h5" color="error.main" sx={{ mt: 2 }}>{profile.virtualBalance.toLocaleString('ru-RU')} VT</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button fullWidth variant="contained" startIcon={<AddCircleOutlineIcon />} disabled={busy || !isAdmin} onClick={() => adjustMyWallet('topup')}>Пополнить</Button>
              <Button fullWidth variant="outlined" startIcon={<RemoveCircleOutlineIcon />} disabled={busy || !isAdmin} onClick={() => adjustMyWallet('withdraw')}>Снять</Button>
            </Stack>
            {!isAdmin && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Изменять виртуальную валюту может только администратор.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={800}>Заметка о пользователе</Typography>
              <Chip label="лично" size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {profile.bio || 'Здесь можно хранить короткую заметку о сделках и доверии.'}
            </Typography>
          </Paper>
        </Stack>

        <Stack spacing={2}>
          <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="h6" fontWeight={800}>{profile.username}</Typography>
                  {profile.isEmailVerified && <VerifiedOutlinedIcon color="primary" fontSize="small" />}
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 1 }}>
                  <Typography color="text.secondary">Регистрация:</Typography>
                  <Typography fontWeight={700}>{joinedAt}</Typography>
                  <Typography color="text.secondary">ID:</Typography>
                  <Typography fontWeight={700}>{profile.id.slice(0, 8)}</Typography>
                  <Typography color="text.secondary">Статус:</Typography>
                  <Typography fontWeight={700}>{primaryRole}</Typography>
                </Box>
              </Box>
              <Typography color="text.secondary" sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                Смотрит объявления на Маркете, только что
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.25} sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1 }}>
              {profile.roles.map((role) => (
                <Chip key={role} label={role} color={role === 'Admin' ? 'error' : role === 'Moderator' ? 'warning' : 'primary'} variant="outlined" />
              ))}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ForumOutlinedIcon color="primary" />
                <Typography fontWeight={800}>Темы от {profile.username}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShoppingCartOutlinedIcon color="primary" />
                <Typography fontWeight={800}>Аккаунты на Маркете</Typography>
              </Stack>
            </Stack>

            <Divider sx={{ mt: 3 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 1, pt: 2 }}>
              {statItems.map(([value, label]) => (
                <Box key={label} sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main" fontWeight={800}>{value}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Tabs value={0} variant="scrollable" scrollButtons="auto" sx={{ px: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Tab label="Стена" />
              <Tab label="Собственные посты" />
              <Tab label="Лента" />
              <Tab label="Недавние сообщения" />
              <Tab label="История блокировок" />
            </Tabs>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: '#07100b', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)' }}>{initials}</Avatar>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Напишите что-нибудь..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2, ml: { xs: 0, sm: 7 } }}>
                <Button variant="contained" disabled={busy || !postText.trim()} onClick={publishPost}>Опубликовать</Button>
                <Button variant="outlined" disabled>Добавить голосование</Button>
              </Stack>
            </Box>
          </Paper>

          <Stack spacing={1.25}>
            {posts.length === 0 ? (
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">На стене пока нет ни одного сообщения</Typography>
              </Paper>
            ) : posts.map((post) => (
              <Paper key={post.id} sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#07100b', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)' }}>{initials}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 1 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Typography fontWeight={800}>{profile.username}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(post.createdAt)}</Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{post.content}</Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
