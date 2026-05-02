import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import ErrorBoundary from '@/components/ErrorBoundary'
import LandingLayout from '@/layouts/LandingLayout'
import AuthLayout from '@/layouts/AuthLayout'
import BasicLayout from '@/layouts/BasicLayout'
import LandingPage from '@/pages/landing'
import CollegeLibraryPage from '@/pages/colleges'
import AssistantPage from '@/pages/assistant'
import UserCenterPage from '@/pages/user-center'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard'
import ProfilePage from '@/pages/profile'
import BindingsPage from '@/pages/bindings'
import AnalysisPage from '@/pages/analysis'
import VolunteerSimulatorPage from '@/pages/simulator'
import MembershipPage from '@/pages/membership'
import OrdersPage from '@/pages/orders'
import NotFoundPage from '@/pages/NotFound'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminBindingsPage from '@/pages/admin/AdminBindingsPage'
import AdminPaymentOrdersPage from '@/pages/admin/AdminPaymentOrdersPage'
import UiPersonAPreview from '@/pages/dev/UiPersonAPreview'
import RequireAuth from '@/components/RequireAuth'
import RequireAdmin from '@/components/RequireAdmin'
import NoAuth from '@/components/NoAuth'
import GlobalSpin from '@/components/GlobalSpin'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'colleges', element: <CollegeLibraryPage /> },
      { path: 'assistant', element: <AssistantPage /> },
      {
        path: 'bindings',
        element: (
          <RequireAuth>
            <VolunteerSimulatorPage />
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
        path: 'user-center',
        element: (
          <RequireAuth>
            <UserCenterPage />
          </RequireAuth>
        ),
      },
    ],
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
        path: 'bindings-manage',
        element: (
          <RequireAuth>
            <BindingsPage />
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
  ...(import.meta.env.DEV
    ? [
        {
          path: '/dev/ui-person-a',
          element: <UiPersonAPreview />,
        },
      ]
    : []),
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
