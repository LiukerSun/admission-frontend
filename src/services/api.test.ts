import { beforeEach, describe, expect, it, vi } from 'vitest'

const axiosPost = vi.fn()
const axiosCreate = vi.fn()
const apiRetry = vi.fn()
const logout = vi.fn()
let accessToken: string | null = null
let responseRejected: ((error: unknown) => unknown) | undefined

vi.mock('axios', () => ({
  AxiosError: class AxiosError extends Error {},
  default: {
    create: axiosCreate,
    post: axiosPost,
  },
}))

vi.mock('@/utils/constants', () => ({
  API_BASE_URL: 'http://api.test',
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      accessToken,
      logout,
      setAccessToken: (token: string) => {
        accessToken = token
      },
    }),
  },
}))

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function makeUnauthorizedError(url: string) {
  return {
    response: { status: 401 },
    config: {
      url,
      headers: {},
    },
  }
}

async function settleAfterTick(promise: Promise<unknown>) {
  const pending = Symbol('pending')
  return Promise.race([
    promise.then(
      (value) => ({ status: 'resolved' as const, value }),
      (reason) => ({ status: 'rejected' as const, reason })
    ),
    new Promise<typeof pending>((resolve) => {
      setTimeout(() => resolve(pending), 0)
    }),
  ])
}

describe('api refresh queue', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    accessToken = null
    responseRejected = undefined

    apiRetry.mockResolvedValue({ data: { ok: true } })
    axiosCreate.mockReturnValue(
      Object.assign(apiRetry, {
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn((_onFulfilled, onRejected) => {
              responseRejected = onRejected
            }),
          },
        },
      })
    )

    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'refresh-token'),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
      configurable: true,
      writable: true,
    })

    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          href: '',
        },
      },
      configurable: true,
      writable: true,
    })
  })

  it('rejects queued requests when token refresh fails', async () => {
    const refresh = createDeferred<never>()
    const refreshError = new Error('refresh failed')
    axiosPost.mockReturnValueOnce(refresh.promise)

    await import('@/services/api')

    const rejectResponse = responseRejected
    expect(rejectResponse).toBeDefined()

    const firstRequest = Promise.resolve(rejectResponse!(makeUnauthorizedError('/first')))
    const queuedRequest = Promise.resolve(rejectResponse!(makeUnauthorizedError('/second')))

    refresh.reject(refreshError)

    await expect(firstRequest).rejects.toBe(refreshError)
    await expect(settleAfterTick(queuedRequest)).resolves.toEqual({
      status: 'rejected',
      reason: refreshError,
    })
    expect(logout).toHaveBeenCalledTimes(1)
    expect(window.location.href).toBe('/login')
  })
})
