import { useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { listingsApi } from '../api/listingsApi'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Conversation, ListingDetail, Order, SellerReview, Wallet } from '../types'
import { assetUrl, formatDate, formatPrice, getErrorMessage } from '../utils/format'
import { useAppSelector } from '../store/hooks'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAppSelector((s) => s.auth)
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [reviews, setReviews] = useState<SellerReview[]>([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [buyerNote, setBuyerNote] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    listingsApi
      .getById(id)
      .then((r) => {
        setListing(r.data)
        return commerceApi.getSellerReviews(r.data.sellerId)
      })
      .then((r) => setReviews(r.data))
      .catch(() => setError('Объявление не найдено'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || !isAuthenticated) return
    Promise.allSettled([
      commerceApi.getWallet().then((r) => setWallet(r.data)),
      commerceApi.getConversationForListing(id).then((r) => setConversation(r.data)),
    ])
  }, [id, isAuthenticated])

  const total = useMemo(() => (listing ? listing.price * quantity : 0), [listing, quantity])
  const mainImage = assetUrl(listing?.images.find((i) => i.isPrimary)?.url ?? listing?.images[0]?.url)
  const sellerInitial = listing?.sellerUsername?.[0]?.toUpperCase() ?? 'S'

  const buy = async () => {
    if (!listing) return
    if (!isAuthenticated) {
      setError('Войдите в аккаунт, чтобы купить товар')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data: order } = await commerceApi.createOrder(listing.id, quantity, buyerNote)
      setCurrentOrder(order)
      setNotice(`Заказ ${order.orderNumber} создан. Баланс пока не списан: подтвердите товар после проверки.`)
      setListing({ ...listing, stockQuantity: Math.max(listing.stockQuantity - quantity, 0) })
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось оформить заказ'))
    } finally {
      setBusy(false)
    }
  }

  const confirmOrder = async () => {
    if (!currentOrder) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data } = await commerceApi.confirmOrder(currentOrder.id)
      setCurrentOrder(data)
      const walletResponse = await commerceApi.getWallet()
      setWallet(walletResponse.data)
      setNotice('Товар подтверждён. Баланс списан, теперь можно оставить отзыв.')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось подтвердить товар'))
    } finally {
      setBusy(false)
    }
  }

  const submitReview = async () => {
    if (!currentOrder || !listing) return
    setBusy(true)
    setError('')
    try {
      await commerceApi.createReview(currentOrder.id, reviewRating, reviewComment)
      const reviewsResponse = await commerceApi.getSellerReviews(listing.sellerId)
      setReviews(reviewsResponse.data)
      setReviewComment('')
      setNotice('Отзыв опубликован и виден всем пользователям.')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось оставить отзыв'))
    } finally {
      setBusy(false)
    }
  }

  const sendMessage = async () => {
    if (!listing || !message.trim()) return
    if (!isAuthenticated) {
      setError('Войдите в аккаунт, чтобы написать продавцу')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { data } = await commerceApi.sendListingMessage(listing.id, message)
      setConversation(data)
      setMessage('')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось отправить сообщение'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error && !listing) return <Alert severity="error">{error}</Alert>
  if (!listing) return <Alert severity="error">Не найдено</Alert>

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Button component={RouterLink} to="/catalog" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          В каталог
        </Button>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Оформление заказа</Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Категория</Typography>
              <Typography fontWeight={700}>{listing.categoryName}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Наличие</Typography>
              <Typography fontWeight={700}>{listing.stockQuantity} шт.</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Продавец</Typography>
              <Typography component={RouterLink} to={`/seller/${listing.sellerUsername}`} color="primary.main" fontWeight={700}>
                {listing.sellerUsername}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Рейтинг</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Rating value={listing.sellerRating ?? 0} readOnly size="small" precision={0.1} />
              </Stack>
            </Grid>
          </Grid>

          <Typography variant="h5" sx={{ mb: 1 }}>{listing.title}</Typography>
          <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{listing.description}</Typography>

          {listing.tags.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
              {listing.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
            </Stack>
          )}

          {mainImage && (
            <>
              <Typography variant="caption" color="text.secondary">Картинки</Typography>
              <Box sx={{ mt: 1, mb: 3 }}>
                <Box component="img" src={mainImage} alt={listing.title} sx={{ width: 110, height: 82, objectFit: 'cover', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.08)' }} />
              </Box>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <TextField select label="Способ оплаты" value="wallet">
              <MenuItem value="wallet">
                Виртуальный баланс {wallet ? `(${wallet.balance.toLocaleString('ru-RU')} ${wallet.currency})` : ''}
              </MenuItem>
            </TextField>
            <TextField
              label="Количество"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Math.max(Number(e.target.value) || 1, 1), Math.max(listing.stockQuantity, 1)))}
              helperText={`Доступно: ${listing.stockQuantity} шт.`}
            />
            <TextField label="Комментарий продавцу" multiline minRows={2} value={buyerNote} onChange={(e) => setBuyerNote(e.target.value)} />
            <Paper sx={{ p: 2, bgcolor: 'rgba(101,212,110,0.08)', borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">К оплате</Typography>
                <Typography variant="h5" color="primary.main">{formatPrice(total, listing.currency)}</Typography>
              </Stack>
            </Paper>
            {notice && <Alert severity="success">{notice}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {!currentOrder && (
              <Button variant="contained" size="large" startIcon={<ShoppingCartCheckoutIcon />} disabled={busy || listing.stockQuantity <= 0} onClick={buy}>
                Купить без списания баланса
              </Button>
            )}
            {currentOrder && currentOrder.status !== 'Completed' && (
              <Button variant="contained" size="large" disabled={busy} onClick={confirmOrder}>
                Я проверил товар, подтвердить и списать баланс
              </Button>
            )}
            {currentOrder?.status === 'Completed' && (
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Оставить отзыв продавцу</Typography>
                <Rating value={reviewRating} onChange={(_, value) => setReviewRating(value ?? 5)} sx={{ mb: 1 }} />
                <TextField fullWidth multiline minRows={2} label="Комментарий" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} sx={{ mb: 1.5 }} />
                <Button variant="outlined" disabled={busy} onClick={submitReview}>Опубликовать отзыв</Button>
              </Paper>
            )}
            <Typography variant="body2" color="text.secondary">
              При покупке заказ создаётся без списания. Деньги списываются и уходят продавцу только после вашего подтверждения.
            </Typography>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper sx={{ minHeight: 594, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Avatar src={undefined}>{sellerInitial}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={800}>{listing.sellerUsername}</Typography>
              <Typography variant="body2" color="primary.main">Онлайн</Typography>
            </Box>
            <Chip icon={<AccountBalanceWalletIcon />} label={wallet ? `${wallet.balance.toLocaleString('ru-RU')} VT` : 'VT'} variant="outlined" />
          </Box>

          <Box sx={{ flex: 1, p: 2, overflow: 'auto', minHeight: 320 }}>
            {conversation?.messages.length ? (
              <Stack spacing={1.25}>
                {conversation.messages.map((m) => {
                  const mine = m.senderId === user?.id
                  return (
                    <Box key={m.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{ maxWidth: '78%', p: 1.25, borderRadius: 2, bgcolor: mine ? 'rgba(101,212,110,0.16)' : 'rgba(255,255,255,0.06)' }}>
                        <Typography variant="caption" color="text.secondary">{m.senderUsername} · {formatDate(m.createdAt)}</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            ) : (
              <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <Rating value={listing.sellerRating ?? 0} readOnly />
                <Typography color="text.secondary" sx={{ mt: 1 }}>Напишите продавцу перед оплатой</Typography>
              </Stack>
            )}
          </Box>

          <Box sx={{ p: 1.5, display: 'flex', gap: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <TextField fullWidth placeholder="Написать..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }} />
            <Button variant="contained" onClick={sendMessage} disabled={busy || !message.trim()} sx={{ minWidth: 52 }}>
              <SendIcon />
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, mt: 2, borderRadius: 2 }}>
          <Box className="section-title-row">
            <Typography variant="h6">Отзывы продавца</Typography>
            <Chip label={reviews.length} size="small" />
          </Box>
          {reviews.length === 0 ? (
            <Typography color="text.secondary">Пока нет отзывов</Typography>
          ) : (
            <Stack spacing={1.5}>
              {reviews.slice(0, 5).map((review) => (
                <Box key={review.id}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700}>{review.reviewerUsername}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Stack>
                  {review.comment && <Typography color="text.secondary">{review.comment}</Typography>}
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Grid>
    </Grid>
  )
}
