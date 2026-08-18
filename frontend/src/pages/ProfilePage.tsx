import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { commerceApi } from '../api/commerceApi'
import { promoCodesApi } from '../api/promoCodesApi'
import { usersApi } from '../api/usersApi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchProfile, setVirtualBalance } from '../store/authSlice'
import type { ProfilePost } from '../types'
import { formatDate, getErrorMessage } from '../utils/format'
import { useTranslation } from '../i18n/LanguageProvider'

export default function ProfilePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { profile, user } = useAppSelector((s) => s.auth)
  const [posts, setPosts] = useState<ProfilePost[]>([])
  const [postText, setPostText] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [editValues, setEditValues] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: '',
    phone: '',
    bio: '',
  })
  const [passwordValues, setPasswordValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswordFields, setShowPasswordFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

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
  const statItems = [
    ['0', t('sympathy')],
    ['0', t('likes')],
    ['0', t('messages')],
    ['0', t('trophies')],
    ['0', t('subscriptions')],
  ]
  const primaryRole = profile.roles.includes('Admin')
    ? t('administrator')
    : profile.roles.includes('Moderator')
      ? t('moderator')
      : profile.roles.includes('Seller')
        ? t('seller')
        : t('userRole')

  const openEditProfile = () => {
    setEditValues({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      phone: profile.phone ?? '',
      bio: profile.bio ?? '',
    })
    setEditOpen(true)
  }

  const saveProfile = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await usersApi.updateMe({
        firstName: editValues.firstName.trim(),
        lastName: editValues.lastName.trim(),
        avatarUrl: editValues.avatarUrl.trim(),
        phone: editValues.phone.trim(),
        bio: editValues.bio.trim(),
      })
      await dispatch(fetchProfile())
      setEditOpen(false)
      setNotice(t('profileUpdated'))
    } catch (e) {
      setError(getErrorMessage(e, t('profileUpdateFail')))
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async () => {
    if (passwordValues.newPassword.length < 8) {
      setError(t('newPasswordMin'))
      return
    }

    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      setError(t('passwordsMismatch'))
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      await usersApi.changePassword(passwordValues)
      setPasswordOpen(false)
      setPasswordValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordFields({ currentPassword: false, newPassword: false, confirmPassword: false })
      setNotice(t('passwordChanged'))
    } catch (e) {
      setError(getErrorMessage(e, t('changePasswordFail')))
    } finally {
      setBusy(false)
    }
  }

  const adjustMyWallet = async (direction: 'topup' | 'withdraw') => {
    if (!isAdmin) {
      setError(t('walletAdminOnly'))
      return
    }

    const raw = window.prompt(direction === 'topup' ? t('topUpPrompt') : t('withdrawPrompt'), '1000')
    if (raw === null) return

    const amount = Number(raw.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('positiveAmount'))
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (direction === 'topup') await commerceApi.topUpWallet(amount)
      else await commerceApi.withdrawWallet(amount)
      await dispatch(fetchProfile())
    } catch (e) {
      setError(getErrorMessage(e, t('balanceChangeFail')))
    } finally {
      setBusy(false)
    }
  }

  const redeemPromo = async () => {
    const code = promoCode.trim()
    if (!code) {
      setError(t('enterPromoCode'))
      return
    }

    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data } = await promoCodesApi.redeem(code)
      setPromoCode('')
      setNotice(`${t('promoActivated')} ${data.code}: +${data.bonusAmount.toLocaleString('ru-RU')} VT`)
      dispatch(setVirtualBalance(data.balance))
      await dispatch(fetchProfile())
    } catch (e) {
      setError(getErrorMessage(e, t('redeemPromoFail')))
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
      setError(getErrorMessage(e, t('publishPostFail')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('forum')} / {t('users')} / <Box component="span" sx={{ color: 'primary.main' }}>{profile.username}</Box>
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
            <Stack spacing={1}>
              <Button fullWidth variant="outlined" startIcon={<EditOutlinedIcon />} disabled={busy} onClick={openEditProfile}>{t('edit')}</Button>
              {profile.canChangePassword && (
                <Button fullWidth variant="outlined" startIcon={<LockResetOutlinedIcon />} disabled={busy} onClick={() => setPasswordOpen(true)}>
                  {t('changePassword')}
                </Button>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography color="text.secondary" fontWeight={700}>{t('insuranceDeposit')}</Typography>
            <Typography fontWeight={800} sx={{ mt: 0.5 }}>{profile.username}</Typography>
            <Typography variant="h5" color="error.main" sx={{ mt: 2 }}>{profile.virtualBalance.toLocaleString('ru-RU')} VT</Typography>
            <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                disabled={busy || !isAdmin}
                onClick={() => adjustMyWallet('topup')}
                sx={{
                  minHeight: 48,
                  justifyContent: 'center',
                  '&.Mui-disabled': {
                    color: 'rgba(255,255,255,0.82)',
                    bgcolor: 'rgba(101,212,110,0.58)',
                  },
                }}
              >
                {t('topUp')}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RemoveCircleOutlineIcon />}
                disabled={busy || !isAdmin}
                onClick={() => adjustMyWallet('withdraw')}
                sx={{
                  minHeight: 48,
                  justifyContent: 'center',
                  '&.Mui-disabled': {
                    color: 'rgba(255,255,255,0.62)',
                    borderColor: 'rgba(255,255,255,0.16)',
                  },
                }}
              >
                {t('withdraw')}
              </Button>
            </Stack>
            {!isAdmin && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('adminWalletOnly')}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalOfferOutlinedIcon color="primary" fontSize="small" />
              <Typography fontWeight={800}>{t('promoCode')}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('promoHint')}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              <TextField
                size="small"
                id="vaulttrade-promo-code"
                name="vaulttrade-promo-code"
                placeholder="WELCOME1000"
                autoComplete="one-time-code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void redeemPromo()
                }}
              />
                <Button
                  variant="contained"
                  disabled={busy || !promoCode.trim()}
                  onClick={redeemPromo}
                  sx={{
                    minHeight: 48,
                    '&.Mui-disabled': {
                      color: 'rgba(255,255,255,0.82)',
                      bgcolor: 'rgba(101,212,110,0.58)',
                    },
                  }}
                >
                  {t('activate')}
                </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={800}>{t('userNote')}</Typography>
              <Chip label={t('personal')} size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {profile.bio || t('userNoteEmpty')}
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
                  <Typography color="text.secondary">{t('registrationDate')}</Typography>
                  <Typography fontWeight={700}>{joinedAt}</Typography>
                  <Typography color="text.secondary">ID:</Typography>
                  <Typography fontWeight={700}>{profile.id.slice(0, 8)}</Typography>
                  <Typography color="text.secondary">{t('status')}</Typography>
                  <Typography fontWeight={700}>{primaryRole}</Typography>
                </Box>
              </Box>
              <Typography color="text.secondary" sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                {t('viewingMarket')}
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
                <Typography fontWeight={800}>{t('topicsBy')} {profile.username}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShoppingCartOutlinedIcon color="primary" />
                <Typography fontWeight={800}>{t('marketAccounts')}</Typography>
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
              <Tab label={t('wall')} />
              <Tab label={t('ownPosts')} />
              <Tab label={t('feed')} />
              <Tab label={t('recentMessages')} />
              <Tab label={t('blockHistory')} />
            </Tabs>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: '#07100b', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)' }}>{initials}</Avatar>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder={t('writeSomething')}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2, ml: { xs: 0, sm: 7 } }}>
                <Button
                  variant="contained"
                  disabled={busy || !postText.trim()}
                  onClick={publishPost}
                  sx={{
                    minHeight: 50,
                    px: 3,
                    '&.Mui-disabled': {
                      color: 'rgba(255,255,255,0.82)',
                      bgcolor: 'rgba(101,212,110,0.58)',
                    },
                  }}
                >
                  {t('publish')}
                </Button>
                <Button variant="outlined" disabled>{t('addPoll')}</Button>
              </Stack>
            </Box>
          </Paper>

          <Stack spacing={1.25}>
            {posts.length === 0 ? (
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('wallEmpty')}</Typography>
              </Paper>
            ) : posts.map((post) => (
              <Paper key={post.id} sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#07100b', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)' }}>
                    {(post.authorUsername || profile.username).slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 1 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Typography
                        component={RouterLink}
                        to={`/seller/${post.authorUsername || profile.username}`}
                        fontWeight={800}
                        sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                      >
                        {post.authorUsername || profile.username}
                      </Typography>
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

      <Dialog open={editOpen} onClose={() => busy ? undefined : setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <EditOutlinedIcon color="primary" />
          {t('editProfile')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Avatar
                  src={editValues.avatarUrl || undefined}
                  sx={{ width: 92, height: 92, bgcolor: '#07100b', color: 'primary.main', border: '1px solid rgba(101,212,110,0.28)', fontSize: 34 }}
                >
                  {initials}
                </Avatar>
              </Box>
              <TextField
                fullWidth
                label={t('avatarUrl')}
                placeholder="https://..."
                value={editValues.avatarUrl}
                onChange={(e) => setEditValues((current) => ({ ...current, avatarUrl: e.target.value }))}
                helperText={t('avatarHelper')}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label={t('firstName')}
                value={editValues.firstName}
                onChange={(e) => setEditValues((current) => ({ ...current, firstName: e.target.value }))}
              />
              <TextField
                fullWidth
                label={t('lastName')}
                value={editValues.lastName}
                onChange={(e) => setEditValues((current) => ({ ...current, lastName: e.target.value }))}
              />
            </Stack>

            <TextField
              fullWidth
              label={t('phone')}
              value={editValues.phone}
              onChange={(e) => setEditValues((current) => ({ ...current, phone: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label={t('userNote')}
              value={editValues.bio}
              onChange={(e) => setEditValues((current) => ({ ...current, bio: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setEditOpen(false)} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={saveProfile} disabled={busy}>
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordOpen} onClose={() => busy ? undefined : setPasswordOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <LockResetOutlinedIcon color="primary" />
          {t('changePassword')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.75} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              id="profile-current-password"
              name="profile-current-password"
              label={t('currentPassword')}
              type={showPasswordFields.currentPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={passwordValues.currentPassword}
              onChange={(e) => setPasswordValues((current) => ({ ...current, currentPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={showPasswordFields.currentPassword ? t('hidePassword') : t('showPassword')}
                      onClick={() => setShowPasswordFields((current) => ({ ...current, currentPassword: !current.currentPassword }))}
                    >
                      {showPasswordFields.currentPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              id="profile-new-password"
              name="profile-new-password"
              label={t('newPassword')}
              type={showPasswordFields.newPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={passwordValues.newPassword}
              onChange={(e) => setPasswordValues((current) => ({ ...current, newPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={showPasswordFields.newPassword ? t('hidePassword') : t('showPassword')}
                      onClick={() => setShowPasswordFields((current) => ({ ...current, newPassword: !current.newPassword }))}
                    >
                      {showPasswordFields.newPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              id="profile-confirm-password"
              name="profile-confirm-password"
              label={t('repeatNewPassword')}
              type={showPasswordFields.confirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={passwordValues.confirmPassword}
              onChange={(e) => setPasswordValues((current) => ({ ...current, confirmPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={showPasswordFields.confirmPassword ? t('hidePassword') : t('showPassword')}
                      onClick={() => setShowPasswordFields((current) => ({ ...current, confirmPassword: !current.confirmPassword }))}
                    >
                      {showPasswordFields.confirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setPasswordOpen(false)} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            onClick={changePassword}
            disabled={busy || !passwordValues.currentPassword || !passwordValues.newPassword || !passwordValues.confirmPassword}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
