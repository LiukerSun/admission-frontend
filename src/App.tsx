import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import LandingLayout from '@/layouts/LandingLayout'
import AuthLayout from '@/layouts/AuthLayout'
import BasicLayout from '@/layouts/BasicLayout'
import LandingPage from '@/pages/landing'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard'
import ProfilePage from '@/pages/profile'
import AnalysisPage from '@/pages/analysis'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminBindingsPage from '@/pages/admin/AdminBindingsPage'
import AdminPaymentOrdersPage from '@/pages/admin/AdminPaymentOrdersPage'
import RequireAuth from '@/components/RequireAuth'
import RequireAdmin from '@/components/RequireAdmin'
import NoAuth from '@/components/NoAuth'
import GlobalSpin from '@/components/GlobalSpin'
import AccountRouteRedirect from '@/components/AccountRouteRedirect'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [{ index: true, element: <LandingPage /> }],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <NoAuth>
            <LoginPage />
          </NoAuth>
        ),
      },
      {
        path: 'register',
        element: (
          <NoAuth>
            <RegisterPage />
          </NoAuth>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: 'bindings',
        element: (
          <RequireAuth>
            <AccountRouteRedirect />
          </RequireAuth>
        ),
      },
      {
        path: 'analysis',
        element: (
          <RequireAuth>
            <AnalysisPage />
          </RequireAuth>
        ),
      },
      {
        path: 'membership',
        element: (
          <RequireAuth>
            <AccountRouteRedirect />
          </RequireAuth>
        ),
      },
      {
        path: 'orders',
        element: (
          <RequireAuth>
            <AccountRouteRedirect />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <RequireAdmin>
            <AdminDashboardPage />
          </RequireAdmin>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <RequireAdmin>
            <AdminUsersPage />
          </RequireAdmin>
        ),
      },
      {
        path: 'admin/bindings',
        element: (
          <RequireAdmin>
            <AdminBindingsPage />
          </RequireAdmin>
        ),
      },
      {
        path: 'admin/payment/orders',
        element: (
          <RequireAdmin>
            <AdminPaymentOrdersPage />
          </RequireAdmin>
        ),
      },
    ],
  },
])

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isRestoring, restore } = useAuthStore()

  useEffect(() => {
    restore()
  }, [restore])

  if (isRestoring) {
    return <GlobalSpin />
  }

  return <>{children}</>
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1E40AF',
          borderRadius: 6,
          fontFamily: "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <AppInitializer>
        <RouterProvider router={router} />
      </AppInitializer>
    </ConfigProvider>
  )
}

export default App
