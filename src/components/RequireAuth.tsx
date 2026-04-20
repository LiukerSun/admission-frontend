import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface Props {
  children: React.ReactNode
}

export default function RequireAuth({ children }: Props) {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const location = useLocation()

  if (isRestoring) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
