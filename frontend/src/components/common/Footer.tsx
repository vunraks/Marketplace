import { Box, Container, Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 4, borderTop: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(8,13,18,0.78)' }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} VaultTrade — маркет цифровых товаров
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link component={RouterLink} to="/catalog" color="text.secondary" underline="hover">Каталог</Link>
            <Link component={RouterLink} to="/about" color="text.secondary" underline="hover">О проекте</Link>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
