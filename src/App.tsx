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
import RequireAuth from '@/components/RequireAuth'
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
          colorPrimary: '#1a5fb4',
          borderRadius: 4,
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