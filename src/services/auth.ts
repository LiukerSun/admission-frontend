import axios from 'axios'
import api from './api'
import { API_BASE_URL } from '@/utils/constants'
import type { components } from '@/types/api'

export type CurrentUser = components['schemas']['user.Response']

export type AuthScene = 'register' | 'login'

interface SendAuthCodeRequest {
  phone: string
  scene: AuthScene
}

interface RegisterRequest {
  phone: string
  code: string
  password: string
}

interface LoginRequest {
  phone: string
  password: string
}

interface LoginByCodeRequest {
  phone: string
  code: string
}

interface RefreshRequest {
  refresh_token: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

interface TokenPayload {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface RegisterPayload {
  user: CurrentUser
  token: TokenPayload
}

// Older auto-generated schema names — kept so the bind flow (profile page)
// still type-checks until the OpenAPI types are regenerated.
type SendPhoneCodeRequest = components['schemas']['user.SendPhoneCodeRequest']
type VerifyPhoneRequest = components['schemas']['user.VerifyPhoneRequest']

const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': 'web',
  },
})

export const authApi = {
  getMe: () =>
    api.get<{ data: CurrentUser }>('/api/v1/me'),

  sendAuthCode: (data: SendAuthCodeRequest) =>
    publicClient.post<{ data: { message: string } }>('/api/v1/auth/sms/send', data),

  register: (data: RegisterRequest) =>
    publicClient.post<{ data: RegisterPayload }>('/api/v1/auth/register', data),

  loginByPassword: (data: LoginRequest) =>
    publicClient.post<{ data: TokenPayload }>('/api/v1/auth/login', data),

  loginByCode: (data: LoginByCodeRequest) =>
    publicClient.post<{ data: TokenPayload }>('/api/v1/auth/login/code', data),

  refresh: (data: RefreshRequest) =>
    publicClient.post<{ data: TokenPayload }>('/api/v1/auth/refresh', data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<{ data: { message: string } }>('/api/v1/me/password', data),

  // Bind-flow endpoints (logged-in user changing their phone) — preserved for
  // the profile page.
  sendPhoneCode: (data: SendPhoneCodeRequest) =>
    api.post<{ data: { message: string } }>('/api/v1/me/phone/send-code', data),

  verifyPhoneCode: (data: VerifyPhoneRequest) =>
    api.post<{ data: { message: string } }>('/api/v1/me/phone/verify', data),
}

export { api }
