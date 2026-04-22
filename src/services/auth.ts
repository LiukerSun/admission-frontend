import axios from 'axios'
import api from './api'
import { API_BASE_URL } from '@/utils/constants'
import type { components } from '@/types/api'

export type CurrentUser = components['schemas']['user.Response']

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  user_type: 'parent' | 'student'
}

interface RefreshRequest {
  refresh_token: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

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

  login: (data: LoginRequest) =>
    publicClient.post('/api/v1/auth/login', data),

  register: (data: RegisterRequest) =>
    publicClient.post('/api/v1/auth/register', data),

  refresh: (data: RefreshRequest) =>
    publicClient.post('/api/v1/auth/refresh', data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<{ data: { message: string } }>('/api/v1/me/password', data),

  sendPhoneCode: (data: SendPhoneCodeRequest) =>
    api.post<{ data: { message: string } }>('/api/v1/me/phone/send-code', data),

  verifyPhoneCode: (data: VerifyPhoneRequest) =>
    api.post<{ data: { message: string } }>('/api/v1/me/phone/verify', data),
}

export { api }
