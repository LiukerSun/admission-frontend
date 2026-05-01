import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import RequireAuth from './RequireAuth'

interface Props {
  children: React.ReactNode
}

export default function RequireAdmin({ children }: Props) {
  const { user } = useAuthStore()
  const location = useLocation()
  const bypassAuth = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true'

  if (bypassAuth) {
    return <>{children}</>
  }

  return (
    <RequireAuth>
      {user?.role === 'admin' ? (
        <>{children}</>
      ) : (
        <Navigate to="/dashboard" state={{ from: location }} replace />
      )}
    </RequireAuth>
  )
}
