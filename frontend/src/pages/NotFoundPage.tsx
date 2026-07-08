import { Typography, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <Typography variant="h2" fontWeight={700}>404</Typography>
      <Typography color="text.secondary" gutterBottom>Страница не найдена</Typography>
      <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>На главную</Button>
    </div>
  )
}
