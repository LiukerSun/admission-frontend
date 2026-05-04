import { Navigate, useLocation } from 'react-router-dom'
import { getAccountCenterRedirect } from '@/utils/accountCenter'

export default function AccountRouteRedirect() {
  const location = useLocation()
  const redirectTo = getAccountCenterRedirect(location.pathname) || '/profile'

  return <Navigate to={redirectTo} replace />
}
