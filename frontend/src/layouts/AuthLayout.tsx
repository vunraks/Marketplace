import { Outlet } from 'react-router-dom'
import { Box, Container, Paper, Typography, Stack, Chip } from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import BoltIcon from '@mui/icons-material/Bolt'
import { Link as RouterLink } from 'react-router-dom'
import AuthWaveBackground from '../components/auth/AuthWaveBackground'

export default function AuthLayout() {
  return (
    <Box
      sx={{
        '@keyframes authGridDrift': {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '96px 72px, -96px 72px' },
        },
        '@keyframes authAuroraShift': {
          '0%, 100%': { transform: 'translate3d(-2%, -1%, 0) rotate(0deg)', opacity: 0.5 },
          '50%': { transform: 'translate3d(2%, 1%, 0) rotate(2deg)', opacity: 0.72 },
        },
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        bgcolor: '#010205',
        p: 2,
        background:
          'linear-gradient(135deg, #010205 0%, #05080d 46%, #020403 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-20%',
          zIndex: -4,
          background:
            'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.08), transparent 28rem), radial-gradient(circle at 78% 68%, rgba(255,255,255,0.055), transparent 30rem)',
          filter: 'blur(24px)',
          animation: 'authAuroraShift 12s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -3,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, transparent, black 34%, black 76%, transparent)',
          animation: 'authGridDrift 18s linear infinite',
        },
      }}
    >
      <AuthWaveBackground />
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1fr' }, gap: { xs: 3, md: 5 }, alignItems: 'center' }}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box component={RouterLink} to="/" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.primary', textDecoration: 'none', mb: 4 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#07100b' }}>
                <StorefrontIcon />
              </Box>
              <Typography variant="h5" fontWeight={800}>VaultTrade</Typography>
            </Box>
            <Typography variant="h2" sx={{ mb: 2, letterSpacing: 0 }}>
              Быстрый доступ к цифровому маркету
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.6, mb: 3 }}>
              Войдите, чтобы создавать объявления, отслеживать свои товары и проходить модерацию без лишних шагов.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip icon={<ShieldOutlinedIcon />} label="защищённые роли" variant="outlined" />
              <Chip icon={<BoltIcon />} label="быстрый вход" color="primary" />
            </Stack>
          </Box>

          <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', maxWidth: 500, width: '100%', mx: 'auto', background: 'rgba(15, 23, 32, 0.78)', backdropFilter: 'blur(18px)', boxShadow: '0 24px 80px rgba(0,0,0,0.36)' }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 3 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#07100b' }}>
                <StorefrontIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight={800}>VaultTrade</Typography>
            </Box>
            <Outlet />
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}
