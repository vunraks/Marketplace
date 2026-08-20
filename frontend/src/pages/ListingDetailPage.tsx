import { useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
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
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { listingsApi } from '../api/listingsApi'
import { commerceApi } from '../api/commerceApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { Conversation, ListingDetail, Order, SellerReview, Wallet } from '../types'
import { onConversationUpdated } from '../realtime/notificationHub'
import { assetUrl, formatDateTime, formatPrice, getErrorMessage, imagePlaceholder } from '../utils/format'
import { fetchProfile } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, profile } = useAppSelector((s) => s.auth)
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [reviews, setReviews] = useState<SellerReview[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
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
      commerceApi.getActiveOrderForListing(id).then((r) => setCurrentOrder(r.data)),
      commerceApi.getFavoriteState(id).then((r) => setIsFavorite(r.data.isFavorite)),
    ])
  }, [id, isAuthenticated])

  useEffect(() => {
    if (!id || !isAuthenticated) return

    return onConversationUpdated((next) => {
      if (next.listingId === id) setConversation(next)
    })
  }, [id, isAuthenticated])

  const total = useMemo(() => (listing ? listing.price * quantity : 0), [listing, quantity])
  const isRestricted = Boolean(profile?.isBlocked && (!profile.blockedUntil || new Date(profile.blockedUntil) > new Date()))
  const hasPendingOrder = Boolean(currentOrder && currentOrder.status !== 'Completed')
  const isWalletLoading = isAuthenticated && !wallet
  const isBalanceInsufficient = Boolean(isAuthenticated && wallet && wallet.balance < total)
  const currentOrderAmount = currentOrder?.amount ?? 0
  const isConfirmBalanceInsufficient = Boolean(isAuthenticated && wallet && hasPendingOrder && wallet.balance < currentOrderAmount)
  const balanceShortage = wallet ? Math.max(total - wallet.balance, 0) : 0
  const confirmBalanceShortage = wallet ? Math.max(currentOrderAmount - wallet.balance, 0) : 0
  const galleryImages = useMemo(() => {
    if (!listing) return []
    const ordered = [...listing.images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
    return ordered
      .map((image) => assetUrl(image.url))
      .filter((url): url is string => Boolean(url))
  }, [listing])
  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0]

  const openImagePreview = (index: number) => {
    setSelectedImageIndex(index)
    setImagePreviewOpen(true)
  }

  const showPreviousImage = () => {
    setSelectedImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)
  }

  const showNextImage = () => {
    setSelectedImageIndex((current) => (current + 1) % galleryImages.length)
  }

  const buy = async () => {
    if (!listing) return
    if (!isAuthenticated) {
      setError('Войдите в аккаунт, чтобы купить товар')
      return
    }
    if (isRestricted) {
      setError('Аккаунт ограничен. Доступен только просмотр объявлений.')
      return
    }

    if (!wallet) {
      setError('Баланс еще загружается. Попробуйте через пару секунд.')
      return
    }
    if (wallet.balance < total) {
      setError(`Недостаточно VT для покупки. Не хватает ${formatPrice(total - wallet.balance, 'VT')}.`)
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data: order } = await commerceApi.createOrder(listing.id, quantity, buyerNote)
      setCurrentOrder(order)
      const { data: nextConversation } = await commerceApi.getConversationForListing(listing.id)
      setConversation(nextConversation)
      setNotice(`Заказ ${order.orderNumber} создан. Баланс пока не списан: подтвердите товар после проверки.`)
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось оформить заказ'))
    } finally {
      setBusy(false)
    }
  }

  const toggleFavorite = async () => {
    if (!listing) return
    if (!isAuthenticated) {
      setError('Войдите в аккаунт, чтобы добавлять товары в избранное')
      return
    }
    if (isRestricted) {
      setError('Аккаунт ограничен. Избранное временно недоступно.')
      return
    }

    setBusy(true)
    setError('')
    try {
      if (isFavorite) {
        await commerceApi.removeFavorite(listing.id)
        setIsFavorite(false)
      } else {
        await commerceApi.addFavorite(listing.id)
        setIsFavorite(true)
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось обновить избранное'))
    } finally {
      setBusy(false)
    }
  }

  const confirmOrder = async () => {
    if (!currentOrder) return
    if (isRestricted) {
      setError('Аккаунт ограничен. Подтверждение заказа временно недоступно.')
      return
    }
    if (!wallet) {
      setError('Баланс еще загружается. Попробуйте через пару секунд.')
      return
    }
    if (wallet.balance < currentOrder.amount) {
      setError(`Недостаточно VT для подтверждения заказа. Не хватает ${formatPrice(currentOrder.amount - wallet.balance, 'VT')}.`)
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data } = await commerceApi.confirmOrder(currentOrder.id)
      setCurrentOrder(data)
      const walletResponse = await commerceApi.getWallet()
      setWallet(walletResponse.data)
      await dispatch(fetchProfile())
      const listingResponse = await listingsApi.getById(data.listingId)
      setListing(listingResponse.data)
      setNotice('Товар подтверждён. Баланс списан, теперь можно оставить отзыв.')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось подтвердить товар'))
    } finally {
      setBusy(false)
    }
  }

  const submitReview = async () => {
    if (!currentOrder || !listing) return
    if (isRestricted) {
      setError('Аккаунт ограничен. Отзывы временно недоступны.')
      return
    }
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

  const openDispute = async () => {
    if (!currentOrder) return
    if (isRestricted) {
      setError('Аккаунт ограничен. Споры временно недоступны.')
      return
    }

    const reason = disputeReason.trim()
    if (!reason) {
      setError('Укажите причину спора')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data } = await commerceApi.createDispute(currentOrder.id, reason)
      setCurrentOrder({ ...currentOrder, status: data.orderStatus })
      setDisputeReason('')
      setNotice('Спор открыт. Продавец получит уведомление, а модератор сможет принять решение.')
    } catch (e) {
      setError(getErrorMessage(e, 'Не удалось открыть спор'))
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
    if (isRestricted) {
      setError('Аккаунт ограничен. Сообщения временно недоступны.')
      return
    }

    const isSeller = user?.id?.toLowerCase() === listing.sellerId.toLowerCase()
    if (conversation?.isClosed) {
      setError('Чат закрыт продавцом. При новой покупке этого товара чат откроется автоматически.')
      return
    }

    if (isSeller && (!conversation?.id || conversation.id === '00000000-0000-0000-0000-000000000000')) {
      setError('Ответьте покупателю в разделе Чаты — здесь чат появится после его сообщения.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { data } = isSeller && conversation?.id && conversation.id !== '00000000-0000-0000-0000-000000000000'
        ? await commerceApi.sendConversationMessage(conversation.id, message)
        : await commerceApi.sendListingMessage(listing.id, message)
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

  const isOwnListing = user?.id?.toLowerCase() === listing.sellerId.toLowerCase()
  const chatPartner =
    conversation?.participants.find((p) => p.userId.toLowerCase() !== user?.id?.toLowerCase())?.username
    || (isOwnListing ? 'Покупатель' : listing.sellerUsername)
  const chatPartnerInitial = chatPartner?.[0]?.toUpperCase() ?? 'S'
  const chatProfileUsername = chatPartner && chatPartner !== 'Покупатель'
    ? chatPartner
    : listing.sellerUsername

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Button component={RouterLink} to="/catalog" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          В каталог
        </Button>

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h3">Оформление заказа</Typography>
            <Button
              variant={isFavorite ? 'contained' : 'outlined'}
              color={isFavorite ? 'primary' : 'inherit'}
              startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              onClick={toggleFavorite}
              disabled={busy || isRestricted}
              sx={{ flexShrink: 0 }}
            >
              {isFavorite ? 'В избранном' : 'В избранное'}
            </Button>
          </Box>

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
              <Button
                component={RouterLink}
                to={`/seller/${encodeURIComponent(listing.sellerUsername)}`}
                variant="text"
                size="small"
                sx={{
                  justifyContent: 'flex-start',
                  minWidth: 0,
                  px: 0,
                  fontWeight: 800,
                  textTransform: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                @{listing.sellerUsername}
              </Button>
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

          {galleryImages.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary">Картинки</Typography>
              <Box sx={{ mt: 1, mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {galleryImages.map((imageUrl, index) => (
                  <Box
                    key={imageUrl}
                    component="button"
                    type="button"
                    onClick={() => openImagePreview(index)}
                    sx={{
                      width: 118,
                      height: 88,
                      p: 0,
                      border: index === selectedImageIndex ? '2px solid' : '1px solid',
                      borderColor: index === selectedImageIndex ? 'primary.main' : 'rgba(255,255,255,0.12)',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      bgcolor: 'transparent',
                      cursor: 'zoom-in',
                    }}
                  >
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={`${listing.title} ${index + 1}`}
                      onError={(event) => {
                        event.currentTarget.src = imagePlaceholder
                      }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                ))}
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
              disabled={isRestricted}
            />
            <TextField label="Комментарий продавцу" multiline minRows={2} value={buyerNote} onChange={(e) => setBuyerNote(e.target.value)} disabled={isRestricted} />
            <Paper sx={{ p: 2, bgcolor: 'rgba(101,212,110,0.08)', borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary">К оплате</Typography>
                <Typography variant="h5" color="primary.main">{formatPrice(total, listing.currency)}</Typography>
              </Stack>
            </Paper>
            {isBalanceInsufficient && !hasPendingOrder && (
              <Alert severity="warning">
                Недостаточно VT для покупки. На балансе {formatPrice(wallet?.balance ?? 0, 'VT')}, не хватает {formatPrice(balanceShortage, 'VT')}.
              </Alert>
            )}
            {isConfirmBalanceInsufficient && hasPendingOrder && (
              <Alert severity="warning">
                Недостаточно VT для подтверждения заказа. Нужно {formatPrice(currentOrderAmount, 'VT')}, не хватает {formatPrice(confirmBalanceShortage, 'VT')}.
              </Alert>
            )}
            {notice && <Alert severity="success">{notice}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {isRestricted && (
              <Alert severity="warning">
                Аккаунт ограничен: доступен только просмотр объявления.
              </Alert>
            )}
            {!hasPendingOrder && (
              <Button variant="contained" size="large" startIcon={<ShoppingCartCheckoutIcon />} disabled={busy || isRestricted || listing.stockQuantity <= 0 || isWalletLoading || isBalanceInsufficient} onClick={buy}>
                Купить без списания баланса
              </Button>
            )}
            {currentOrder && currentOrder.status !== 'Completed' && (
              <Stack spacing={1.25}>
                <Button variant="contained" size="large" disabled={busy || isRestricted || currentOrder.status === 'Disputed' || isWalletLoading || isConfirmBalanceInsufficient} onClick={confirmOrder}>
                  Я проверил товар, подтвердить и списать баланс
                </Button>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography fontWeight={800} sx={{ mb: 1 }}>Проблема с заказом?</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      fullWidth
                      label="Причина спора"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      disabled={isRestricted || currentOrder.status === 'Disputed'}
                    />
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<GavelOutlinedIcon />}
                      disabled={busy || isRestricted || currentOrder.status === 'Disputed'}
                      onClick={openDispute}
                    >
                      Открыть спор
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            )}
            {currentOrder?.status === 'Completed' && (
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>Оставить отзыв продавцу</Typography>
                <Rating value={reviewRating} onChange={(_, value) => setReviewRating(value ?? 5)} sx={{ mb: 1 }} />
                <TextField fullWidth multiline minRows={2} label="Комментарий" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} disabled={isRestricted} sx={{ mb: 1.5 }} />
                <Button variant="outlined" disabled={busy || isRestricted} onClick={submitReview}>Опубликовать отзыв</Button>
              </Paper>
            )}
            <Typography variant="body2" color="text.secondary">
              При покупке заказ создаётся без списания. Деньги списываются и уходят продавцу только после вашего подтверждения.
            </Typography>
          </Stack>
        </Paper>
      </Grid>

      <Dialog open={imagePreviewOpen} onClose={() => setImagePreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: '#070b0f', position: 'relative', minHeight: { xs: 320, md: 620 }, display: 'grid', placeItems: 'center' }}>
          <IconButton onClick={() => setImagePreviewOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2, bgcolor: 'rgba(0,0,0,0.45)' }}>
            <CloseIcon />
          </IconButton>
          {galleryImages.length > 1 && (
            <>
              <IconButton onClick={showPreviousImage} sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'rgba(0,0,0,0.45)' }}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={showNextImage} sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'rgba(0,0,0,0.45)' }}>
                <ChevronRightIcon />
              </IconButton>
            </>
          )}
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt={listing.title}
              onError={(event) => {
                event.currentTarget.src = imagePlaceholder
              }}
              sx={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', display: 'block' }}
            />
          )}
          {galleryImages.length > 1 && (
            <Typography sx={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', px: 1.5, py: 0.5, borderRadius: 999, bgcolor: 'rgba(0,0,0,0.55)' }}>
              {selectedImageIndex + 1} / {galleryImages.length}
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper sx={{ height: { xs: 560, lg: 594 }, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden', minHeight: 0 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Box
              component={RouterLink}
              to={`/seller/${encodeURIComponent(chatProfileUsername)}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minWidth: 0,
                flex: 1,
                color: 'inherit',
                textDecoration: 'none',
                borderRadius: 2,
                '&:hover .chat-profile-name': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              <Avatar src={undefined}>{chatPartnerInitial}</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800} noWrap>{listing.title}</Typography>
                <Typography className="chat-profile-name" variant="body2" color="primary.main">{chatPartner}</Typography>
                {conversation?.openedAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {conversation.isClosed ? 'Закрыт' : 'Открыт'}: {formatDateTime(conversation.isClosed && conversation.closedAt ? conversation.closedAt : conversation.openedAt)}
                  </Typography>
                )}
              </Box>
            </Box>
            <Chip icon={<AccountBalanceWalletIcon />} label={wallet ? `${wallet.balance.toLocaleString('ru-RU')} VT` : 'VT'} variant="outlined" />
          </Box>

          <Box sx={{ flex: '1 1 auto', p: 2, overflow: 'auto', minHeight: 0 }}>
            {conversation?.messages.length ? (
              <Stack spacing={1.25}>
                {conversation.messages.map((m) => {
                  const mine = m.senderId === user?.id
                  return (
                    <Box key={m.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <Box sx={{ maxWidth: '78%', p: 1.25, borderRadius: 2, bgcolor: mine ? 'rgba(101,212,110,0.16)' : 'rgba(255,255,255,0.06)', overflowWrap: 'anywhere' }}>
                        <Typography variant="caption" color="text.secondary">{m.senderUsername} · {formatDateTime(m.createdAt)}</Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.content}</Typography>
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

          {conversation?.isClosed && (
            <Alert severity="info" sx={{ borderRadius: 0 }}>
              Чат закрыт продавцом. При новой покупке этого товара чат откроется автоматически.
            </Alert>
          )}
          <Box sx={{ p: 1.5, display: 'flex', gap: 1, borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={3}
              placeholder={conversation?.isClosed ? 'Чат закрыт' : 'Написать...'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isRestricted || conversation?.isClosed}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage()
                }
              }}
            />
            <Button variant="contained" onClick={sendMessage} disabled={busy || isRestricted || conversation?.isClosed || !message.trim()} sx={{ alignSelf: 'flex-end', minHeight: 56, minWidth: 56 }}>
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
