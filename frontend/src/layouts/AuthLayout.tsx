import { Outlet } from 'react-router-dom'
import { Box, Container, Paper, Typography, Stack, Chip } from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import BoltIcon from '@mui/icons-material/Bolt'
import { Link as RouterLink } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <Box
      sx={{
        '@keyframes authGridDrift': {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '96px 72px, -96px 72px' },
        },
        '@keyframes authAuroraShift': {
          '0%, 100%': { transform: 'translate3d(-2%, -1%, 0) rotate(0deg)', opacity: 0.72 },
          '50%': { transform: 'translate3d(2%, 1%, 0) rotate(2deg)', opacity: 0.95 },
        },
        '@keyframes authScan': {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)', opacity: 0 },
          '18%': { opacity: 0.55 },
          '55%': { opacity: 0.18 },
          '100%': { transform: 'translateX(120%) skewX(-18deg)', opacity: 0 },
        },
        '@keyframes authStream': {
          '0%': { transform: 'translate3d(-18%, 0, 0)', opacity: 0.08 },
          '35%': { opacity: 0.45 },
          '100%': { transform: 'translate3d(18%, 0, 0)', opacity: 0.08 },
        },
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        bgcolor: '#061017',
        p: 2,
        background:
          'linear-gradient(135deg, #05090f 0%, #08141c 44%, #071611 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-20%',
          zIndex: -3,
          background:
            'conic-gradient(from 130deg at 24% 28%, rgba(34,197,94,0.22), rgba(56,189,248,0.18), rgba(168,85,247,0.11), rgba(34,197,94,0.16), rgba(34,197,94,0.22))',
          filter: 'blur(32px)',
          animation: 'authAuroraShift 12s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 76%, transparent)',
          animation: 'authGridDrift 18s linear infinite',
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '42%',
            width: '28%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            animation: 'authScan 7s ease-in-out infinite',
          },
          '.auth-stream': {
            position: 'absolute',
            height: 2,
            borderRadius: 999,
            background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.58), rgba(34,197,94,0.42), transparent)',
            boxShadow: '0 0 24px rgba(56,189,248,0.22)',
            animation: 'authStream 8s ease-in-out infinite',
          },
        }}
      >
        <Box className="auth-stream" sx={{ width: '34%', top: '18%', left: '7%', transform: 'rotate(-11deg)', animationDelay: '-1s' }} />
        <Box className="auth-stream" sx={{ width: '42%', top: '64%', right: '4%', transform: 'rotate(9deg)', animationDelay: '-3.5s' }} />
        <Box className="auth-stream" sx={{ width: '26%', top: '82%', left: '18%', transform: 'rotate(4deg)', animationDelay: '-5s' }} />
      </Box>
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
