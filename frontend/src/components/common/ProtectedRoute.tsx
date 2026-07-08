import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'

interface ProtectedRouteProps {
  requireSeller?: boolean
  requireModerator?: boolean
  requireAdmin?: boolean
}

export default function ProtectedRoute({ requireSeller = false, requireModerator = false, requireAdmin = false }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireSeller) {
    const isSeller = user?.roles.some((r) => ['Seller', 'Moderator', 'Admin'].includes(r))
    if (!isSeller) return <Navigate to="/become-seller" replace />
  }

  if (requireModerator) {
    const isModerator = user?.roles.some((r) => ['Moderator', 'Admin'].includes(r))
    if (!isModerator) return <Navigate to="/" replace />
  }

  if (requireAdmin) {
    const isAdmin = user?.roles.includes('Admin')
    if (!isAdmin) return <Navigate to="/" replace />
  }

  return <Outlet />
}
