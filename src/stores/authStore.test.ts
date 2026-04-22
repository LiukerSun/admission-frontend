import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPost = vi.fn()
const mockGetMe = vi.fn()
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    clear: () => {
      store = {}
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key]
    },
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    get length() {
      return Object.keys(store).length
    },
  }
})()

vi.mock('@/services/auth', () => ({
  authApi: {
    getMe: mockGetMe,
    login: mockPost,
    register: mockPost,
    refresh: mockPost,
  },
}))

describe('useAuthStore', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    })
    localStorage.clear()
  })

  it('restores auth state from refresh token and loads current user', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token-next',
        },
      },
    })
    mockGetMe.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          email: 'admin@example.com',
          phone: '13800138000',
          phone_verified: true,
          role: 'admin',
          user_type: 'parent',
          created_at: '2026-04-21T00:00:00Z',
        },
      },
    })

    localStorage.setItem('refresh_token', 'refresh-token')

    const { useAuthStore } = await import('@/stores/authStore')

    await useAuthStore.getState().restore()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('access-token')
    expect(state.user?.email).toBe('admin@example.com')
    expect(state.user?.phone).toBe('13800138000')
    expect(state.user?.phone_verified).toBe(true)
    expect(state.user?.role).toBe('admin')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token-next')
  })

  it('clears auth state when restore fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('refresh failed'))
    localStorage.setItem('refresh_token', 'refresh-token')

    const { useAuthStore } = await import('@/stores/authStore')

    await useAuthStore.getState().restore()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.isRestoring).toBe(false)
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})
