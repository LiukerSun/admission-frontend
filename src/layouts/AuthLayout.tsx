import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  // The split-pane layout lives inside each auth page so we just hand out the
  // full viewport here.
  return <Outlet />
}
