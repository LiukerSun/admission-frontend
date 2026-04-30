import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/utils/constants'
import { useAuthStore } from '@/stores/authStore'

type Subscriber = { resolve: (token: string) => void; reject: (err: unknown) => void }

let isRefreshing = false
let refreshSubscribers: Subscriber[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((s) => s.resolve(token))
  refreshSubscribers = []
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((s) => s.reject(err))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: Subscriber) {
  refreshSubscribers.push(cb)
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': 'web',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const res = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json', 'X-Platform': 'web' } }
        )

        const data = res.data.data
        if (!data?.access_token) throw new Error('Refresh failed')

        useAuthStore.getState().setAccessToken(data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        }

        onRefreshed(data.access_token)
        return api(originalRequest)
      } catch (refreshErr) {
        onRefreshFailed(refreshErr)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
