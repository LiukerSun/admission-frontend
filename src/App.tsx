import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import LandingLayout from '@/layouts/LandingLayout'
import AuthLayout from '@/layouts/AuthLayout'
import BasicLayout from '@/layouts/BasicLayout'
import LandingPage from '@/pages/landing'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/dashboard'
import ProfilePage from '@/pages/profile'
import BindingsPage from '@/pages/bindings'
import AnalysisPage from '@/pages/analysis'
import MembershipPage from '@/pages/membership'
import OrdersPage from '@/pages/orders'
import NotFoundPage from '@/pages/NotFound'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminBindingsPage from '@/pages/admin/AdminBindingsPage'
import AdminPaymentOrdersPage from '@/pages/admin/AdminPaymentOrdersPage'
import RequireAuth from '@/components/RequireAuth'
import RequireAdmin from '@/components/RequireAdmin'
import NoAuth from '@/components/NoAuth'
import GlobalSpin from '@/components/GlobalSpin'

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
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
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
            <BindingsPage />
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
            <MembershipPage />
          </RequireAuth>
        ),
      },
      {
        path: 'orders',
        element: (
          <RequireAuth>
            <OrdersPage />
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
  {
    path: '*',
    element: <NotFoundPage />,
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
            colorPrimary: '#2F5F8F',
            colorInfo: '#2F5F8F',
            colorSuccess: '#5C9B7B',
            colorWarning: '#C58B45',
            colorError: '#C96C63',
            colorText: '#243447',
            colorTextSecondary: '#66798A',
            colorBgLayout: '#F7F5EF',
            colorBgContainer: '#FFFFFF',
            colorBorder: '#E2E9EA',
            borderRadius: 8,
            fontFamily: '"Noto Sans SC", "Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            wireframe: false,
          },
          components: {
            Button: {
              borderRadius: 8,
              controlHeight: 38,
            },
            Card: {
              borderRadiusLG: 12,
              headerBg: '#FAFBF8',
            },
            Layout: {
              bodyBg: '#F7F5EF',
              headerBg: '#FFFFFF',
              siderBg: '#FFFFFF',
            },
            Menu: {
              itemBorderRadius: 8,
              itemSelectedBg: '#E7F0F7',
              itemSelectedColor: '#2F5F8F',
            },
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
