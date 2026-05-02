import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface Props {
  children: React.ReactNode
}

export default function RequireAuth({ children }: Props) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const location = useLocation()
  const bypassAuth = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true'

  if (isRestoring && !bypassAuth) {
    return null
  }

  if (!isAuthenticated && !bypassAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
