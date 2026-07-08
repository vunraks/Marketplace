import { Outlet } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'

export default function MainLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Container maxWidth="xl" className="page-container" sx={{ flex: 1 }}>
        <Outlet />
      </Container>
      <Footer />
    </Box>
  )
}
