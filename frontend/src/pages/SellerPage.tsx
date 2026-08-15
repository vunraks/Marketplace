import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import { usersApi } from '../api/usersApi'
import { listingsApi } from '../api/listingsApi'
import ListingCard from '../components/listing/ListingCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { ListingCard as ListingCardType, ProfilePost, PublicUserProfile } from '../types'
import { formatDate, getErrorMessage } from '../utils/format'
import { useAppSelector } from '../store/hooks'

export default function SellerPage() {
  const { username } = useParams<{ username: string }>()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [listings, setListings] = useState<ListingCardType[]>([])
  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [postText, setPostText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!username) return
    setLoading(true)
    setError('')
    Promise.all([
      usersApi.getPublic(username),
      listingsApi.getList({ pageSize: 20, status: 'Active' }),
      usersApi.getUserPosts(username),
    ])
      .then(([profileRes, listRes, postsRes]) => {
        setProfile(profileRes.data)
        setListings(listRes.data.items.filter((l) => l.sellerUsername === username))
        setPosts(postsRes.data)
      })
      .catch((e) => setError(getErrorMessage(e, 'Продавец не найден')))
      .finally(() => setLoading(false))
  }, [username])

  const publishPost = async () => {
    if (!username || !postText.trim()) return
    if (!isAuthenticated) {
      setError('Войдите в аккаунт, чтобы написать на стене')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data } = await usersApi.createUserPost(username, postText)
      setPosts((current) => [data, ...current])
      setPostText('')
      setNotice('Сообщение опубликовано на стене')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось опубликовать сообщение'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!profile) return <Alert severity="error">{error || 'Продавец не найден'}</Alert>

  const initials = profile.username.slice(0, 2).toUpperCase()
  const isOwnProfile = user?.username?.toLowerCase() === profile.username.toLowerCase()

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Маркет / Продавцы / <Box component="span" sx={{ color: 'primary.main' }}>{profile.username}</Box>
      </Typography>

      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '230px 1fr' }, gap: 2 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 1.5, borderRadius: 2 }}>
            <Box sx={{ aspectRatio: '1 / 1', borderRadius: 1.5, bgcolor: '#080b0c', display: 'grid', placeItems: 'center', mb: 1.5, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Avatar src={profile.avatarUrl} sx={{ width: '68%', height: '68%', bgcolor: 'transparent', color: 'primary.main', fontSize: 74, fontWeight: 300 }}>
                {initials}
              </Avatar>
            </Box>
            {isOwnProfile ? (
              <Button fullWidth variant="outlined" component={RouterLink} to="/profile">
                Мой профиль
              </Button>
            ) : (
              <Button fullWidth variant="outlined" component={RouterLink} to="/catalog">
                К каталогу
              </Button>
            )}
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <StorefrontOutlinedIcon color="primary" fontSize="small" />
              <Typography fontWeight={800}>О продавце</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {profile.bio || 'Продавец пока не добавил описание.'}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              На маркете с {formatDate(profile.memberSince)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {profile.activeListingsCount} активных объявлений
            </Typography>
          </Paper>
        </Stack>

        <Stack spacing={2}>
          <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>@{profile.username}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Rating value={profile.averageRating ?? 0} readOnly precision={0.1} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {profile.totalReviews} отзывов
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip icon={<ShoppingCartOutlinedIcon />} label={`${profile.activeListingsCount} товаров`} variant="outlined" />
                  <Chip icon={<ForumOutlinedIcon />} label={`${posts.length} на стене`} variant="outlined" />
                </Stack>
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography fontWeight={800}>Стена</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              {isAuthenticated ? (
                <>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: '#07100b', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)' }}>
                      {(user?.username?.[0] ?? '?').toUpperCase()}
                    </Avatar>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder={`Написать на стене @${profile.username}...`}
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 2, ml: { xs: 0, sm: 7 } }}>
                    <Button variant="contained" disabled={busy || !postText.trim()} onClick={publishPost}>
                      Опубликовать
                    </Button>
                  </Stack>
                </>
              ) : (
                <Alert severity="info">
                  <Button component={RouterLink} to="/login" size="small" sx={{ mr: 1 }}>Войдите</Button>
                  чтобы написать на стене продавца.
                </Alert>
              )}
            </Box>
          </Paper>

          <Stack spacing={1.25}>
            {posts.length === 0 ? (
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">На стене пока нет сообщений — напишите первым</Typography>
              </Paper>
            ) : posts.map((post) => (
              <Paper key={post.id} sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#07100b', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)' }}>
                    {post.authorUsername.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 1 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Typography
                        component={RouterLink}
                        to={`/seller/${post.authorUsername}`}
                        fontWeight={800}
                        sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                      >
                        {post.authorUsername}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(post.createdAt)}</Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{post.content}</Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Товары продавца</Typography>
            {listings.length === 0 ? (
              <Alert severity="info">Активных объявлений пока нет</Alert>
            ) : (
              <Box className="listing-grid">
                {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
