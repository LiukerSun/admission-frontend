import { create } from 'zustand'
import { api, authApi } from '@/services/auth'

interface User {
  id: number
  email: string
  role: string
  created_at: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isRestoring: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  restore: () => Promise<void>
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
}

const REFRESH_TOKEN_KEY = 'refresh_token'

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isRestoring: true,

  login: async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const data = res.data.data
    if (!data) throw new Error('登录失败')

    set({
      accessToken: data.access_token,
      isAuthenticated: true,
    })
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)

    const meRes = await api.get('/api/v1/me')
    const user = meRes.data.data as User
    set({ user })
  },

  register: async (email: string, password: string) => {
    await authApi.register({ email, password })
    await get().login(email, password)
  },

  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
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

      const meRes = await api.get('/api/v1/me')
      const user = meRes.data.data as User
      set({ user })
    } catch {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } finally {
      set({ isRestoring: false })
    }
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token })
  },

  setUser: (user: User) => {
    set({ user })
  },
}))
