import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import LandingLayout from '@/layouts/LandingLayout'
import AuthLayout from '@/layouts/AuthLayout'
import BasicLayout from '@/layouts/BasicLayout'
import LandingPage from '@/pages/landing'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AdmissionAIPage from '@/pages/admission-ai'
import VolunteerPlansPage from '@/pages/admission/VolunteerPlansPage'
import DashboardPage from '@/pages/dashboard'
import ProfilePage from '@/pages/profile'
import UniversitySearchPage from '@/pages/university/UniversitySearchPage'
import UniversityPage from '@/pages/university/UniversityPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
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
        path: 'admission/ai',
        element: (
          <RequireAuth>
            <AdmissionAIPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admission/plans',
        element: (
          <RequireAuth>
            <VolunteerPlansPage />
          </RequireAuth>
        ),
      },
      {
        path: 'university',
        element: (
          <RequireAuth>
            <UniversitySearchPage />
          </RequireAuth>
        ),
      },
      {
        path: 'university/:id',
        element: (
          <RequireAuth>
            <UniversityPage />
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
      <AntdApp>
        <AppInitializer>
          <RouterProvider router={router} />
        </AppInitializer>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
