import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { RealtimeBridge } from './realtime/RealtimeBridge'
import { fetchProfile, sessionExpired } from './store/authSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { AUTH_EXPIRED_EVENT } from './utils/storage'

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

  useEffect(() => {
    const handleExpired = () => {
      dispatch(sessionExpired())
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [dispatch])

  return (
    <>
      <RealtimeBridge />
      <AppRoutes />
    </>
  )
}
