import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import RequireAuth from './RequireAuth'

interface Props {
  children: React.ReactNode
}

export default function RequireAdmin({ children }: Props) {
  const { isAdmin } = useAuthStore()
  const location = useLocation()

  return (
    <RequireAuth>
      {isAdmin ? (
        <>{children}</>
      ) : (
        <Navigate to="/dashboard" state={{ from: location }} replace />
      )}
    </RequireAuth>
  )
}
