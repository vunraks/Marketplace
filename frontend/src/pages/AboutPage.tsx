import { Typography, Paper } from '@mui/material'

export default function AboutPage() {
  return (
    <Paper sx={{ p: 4, border: '1px solid #E2E8F0' }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>О VaultTrade</Typography>
      <Typography paragraph>
        VaultTrade — дипломный проект: маркетплейс для покупки и продажи цифровых товаров, игровых аккаунтов, ключей и подписок.
      </Typography>
      <Typography paragraph>
        Backend: ASP.NET Core · PostgreSQL · JWT · SignalR<br />
        Frontend: React · TypeScript · Redux Toolkit · Material UI
      </Typography>
    </Paper>
  )
}
