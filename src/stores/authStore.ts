import { create } from 'zustand'
import { authApi, type CurrentUser } from '@/services/auth'
import type { AxiosError } from 'axios'

export type User = CurrentUser & {
  id: number
  email: string
  role: string
  user_type: 'parent' | 'student'
  created_at: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isRestoring: boolean
  isAdmin: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, userType: 'parent' | 'student') => Promise<void>
  logout: () => void
  restore: () => Promise<void>
  refreshUser: () => Promise<User>
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
}

const REFRESH_TOKEN_KEY = 'refresh_token'

function applyUser(set: (state: Partial<AuthState>) => void, user: User) {
  set({ user, isAdmin: user.role === 'admin' })
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isRestoring: true,
  isAdmin: false,

  login: async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password })
      const data = res.data.data
      if (!data) throw new Error('登录失败')

      set({
        accessToken: data.access_token,
        isAuthenticated: true,
      })
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)

      const meRes = await authApi.getMe()
      const user = meRes.data.data as User
      applyUser(set, user)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      if (axiosErr.response?.status === 401) {
        const msg = axiosErr.response.data?.message || ''
        if (msg.toLowerCase().includes('banned')) {
          localStorage.removeItem(REFRESH_TOKEN_KEY)
          set({ accessToken: null, user: null, isAuthenticated: false, isAdmin: false })
          throw new Error('账号已被封禁，请联系管理员')
        }
      }
      throw err
    }
  },

  register: async (email: string, password: string, userType: 'parent' | 'student') => {
    await authApi.register({ email, password, user_type: userType })
    await get().login(email, password)
  },

  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    })
  },

  restore: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      set({ isRestoring: false })
      return
    }

    try {
      const res = await authApi.refresh({ refresh_token: refreshToken })
      const data = res.data.data
      if (!data) throw new Error('恢复失败')

      set({
        accessToken: data.access_token,
        isAuthenticated: true,
      })
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)

      const meRes = await authApi.getMe()
      const user = meRes.data.data as User
      applyUser(set, user)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      if (axiosErr.response?.status === 401) {
        const msg = axiosErr.response.data?.message || ''
        if (msg.toLowerCase().includes('banned')) {
          localStorage.removeItem(REFRESH_TOKEN_KEY)
          set({ accessToken: null, user: null, isAuthenticated: false, isAdmin: false })
        }
      }
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      })
    } finally {
      set({ isRestoring: false })
    }
  },

  refreshUser: async () => {
    const meRes = await authApi.getMe()
    const user = meRes.data.data as User
    applyUser(set, user)
    return user
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token })
  },

  setUser: (user: User) => {
    applyUser(set, user)
  },
}))
