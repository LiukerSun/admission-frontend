import { useEffect, lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import GlobalSpin from '@/components/GlobalSpin'

const LandingLayout = lazy(() => import('@/layouts/LandingLayout'))
const AuthLayout = lazy(() => import('@/layouts/AuthLayout'))
const BasicLayout = lazy(() => import('@/layouts/BasicLayout'))
const LandingPage = lazy(() => import('@/pages/landing'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const ProfilePage = lazy(() => import('@/pages/profile'))
const BindingsPage = lazy(() => import('@/pages/bindings'))
const AnalysisPage = lazy(() => import('@/pages/analysis'))
const MembershipPage = lazy(() => import('@/pages/membership'))
const OrdersPage = lazy(() => import('@/pages/orders'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminBindingsPage = lazy(() => import('@/pages/admin/AdminBindingsPage'))
const AdminPaymentOrdersPage = lazy(() => import('@/pages/admin/AdminPaymentOrdersPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))
const RequireAuth = lazy(() => import('@/components/RequireAuth'))
const RequireAdmin = lazy(() => import('@/components/RequireAdmin'))
const NoAuth = lazy(() => import('@/components/NoAuth'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<GlobalSpin />}>{children}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <SuspenseWrapper><LandingLayout /></SuspenseWrapper>,
    children: [{ index: true, element: <SuspenseWrapper><LandingPage /></SuspenseWrapper> }],
  },
  {
    path: '/',
    element: <SuspenseWrapper><AuthLayout /></SuspenseWrapper>,
    children: [
      {
        path: 'login',
        element: (
          <SuspenseWrapper>
            <NoAuth>
              <LoginPage />
            </NoAuth>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'register',
        element: (
          <SuspenseWrapper>
            <NoAuth>
              <RegisterPage />
            </NoAuth>
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <SuspenseWrapper><BasicLayout /></SuspenseWrapper>,
    children: [
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'profile',
        element: (
          <SuspenseWrapper>
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'bindings',
        element: (
          <SuspenseWrapper>
            <RequireAuth>
              <BindingsPage />
            </RequireAuth>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'analysis',
        element: (
          <SuspenseWrapper>
            <RequireAuth>
              <AnalysisPage />
            </RequireAuth>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'membership',
        element: (
          <SuspenseWrapper>
            <RequireAuth>
              <MembershipPage />
            </RequireAuth>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'orders',
        element: (
          <SuspenseWrapper>
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <SuspenseWrapper>
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <SuspenseWrapper>
            <RequireAdmin>
              <AdminUsersPage />
            </RequireAdmin>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/bindings',
        element: (
          <SuspenseWrapper>
            <RequireAdmin>
              <AdminBindingsPage />
            </RequireAdmin>
          </SuspenseWrapper>
        ),
      },
      {
        path: 'admin/payment/orders',
        element: (
          <SuspenseWrapper>
            <RequireAdmin>
              <AdminPaymentOrdersPage />
            </RequireAdmin>
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper>,
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export default App
