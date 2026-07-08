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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        p: 2,
        background:
          'radial-gradient(circle at 15% 15%, rgba(101,212,110,0.16), transparent 26rem), radial-gradient(circle at 82% 8%, rgba(68,185,255,0.13), transparent 28rem), #080d12',
      }}
    >
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

          <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.09)', maxWidth: 500, width: '100%', mx: 'auto' }}>
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
