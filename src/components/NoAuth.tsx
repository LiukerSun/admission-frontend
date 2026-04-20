import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface Props {
  children: React.ReactNode
}

export default function NoAuth({ children }: Props) {
  const { isAuthenticated, isRestoring } = useAuthStore()

  if (isRestoring) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
