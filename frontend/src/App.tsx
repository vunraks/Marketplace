import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { fetchProfile } from './store/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'

export default function App() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    if (isAuthenticated && !isAuthPage) {
      dispatch(fetchProfile())
    }
  }, [dispatch, isAuthenticated, isAuthPage])

  return <AppRoutes />
}
