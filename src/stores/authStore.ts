import { create } from 'zustand'
import { authApi, type CurrentUser } from '@/services/auth'
import { membershipApi, type CurrentMembership } from '@/services/membership'
import type { AxiosError } from 'axios'

export type User = CurrentUser & {
  id: number
  email: string
  role: string
  is_admin: boolean
  created_at: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isRestoring: boolean
  isAdmin: boolean
  membership: CurrentMembership | null
  hasActiveMembership: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  restore: () => Promise<void>
  refreshUser: () => Promise<User>
  refreshMembership: () => Promise<CurrentMembership | null>
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
}

const REFRESH_TOKEN_KEY = 'refresh_token'

function applyUser(set: (state: Partial<AuthState>) => void, user: User) {
  set({ user, isAdmin: user.is_admin })
}

function applyMembership(
  set: (state: Partial<AuthState>) => void,
  membership: CurrentMembership | null,
) {
  set({
    membership,
    hasActiveMembership: Boolean(membership?.active),
  })
}

async function fetchMembership(): Promise<CurrentMembership | null> {
  try {
    const res = await membershipApi.getCurrent()
    return res.data.data ?? null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isRestoring: true,
  isAdmin: false,
  membership: null,
  hasActiveMembership: false,

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

      const membership = await fetchMembership()
      applyMembership(set, membership)
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
      isAdmin: false,
      membership: null,
      hasActiveMembership: false,
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

      const membership = await fetchMembership()
      applyMembership(set, membership)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      if (axiosErr.response?.status === 401) {
        const msg = axiosErr.response.data?.message || ''
        if (msg.toLowerCase().includes('banned')) {
          localStorage.removeItem(REFRESH_TOKEN_KEY)
          set({
            accessToken: null,
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            membership: null,
            hasActiveMembership: false,
          })
        }
      }
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        membership: null,
        hasActiveMembership: false,
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

  refreshMembership: async () => {
    const membership = await fetchMembership()
    applyMembership(set, membership)
    return membership
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token })
  },

  setUser: (user: User) => {
    applyUser(set, user)
  },
}))
