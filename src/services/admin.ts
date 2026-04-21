import api from './api'
import type { components } from '@/types/api'

export type StatsResponse = components['schemas']['admin.StatsResponse']
export type UserListResponse = components['schemas']['admin.UserListResponse']
export type UserListItem = components['schemas']['admin.UserListItem']
export type BindingListResponse = components['schemas']['admin.BindingListResponse']
export type BindingListItem = components['schemas']['admin.BindingListItem']
export type UpdateRoleRequest = components['schemas']['admin.UpdateRoleRequest']

export interface AdminUserDetail {
  id: number
  email: string
  username?: string
  role: 'user' | 'premium' | 'admin'
  user_type: 'parent' | 'student'
  status: 'active' | 'banned'
  created_at: string
  updated_at: string
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  role?: 'user' | 'premium' | 'admin'
  user_type?: 'parent' | 'student'
  status?: 'active' | 'banned'
}

export interface UserListQuery {
  page?: number
  page_size?: number
  email?: string
  username?: string
  role?: string
  status?: string
}

export interface BindingListQuery {
  page?: number
  page_size?: number
}

export const adminApi = {
  getStats: () =>
    api.get<{ data: StatsResponse }>('/api/v1/admin/stats'),

  getUsers: (params?: UserListQuery) =>
    api.get<{ data: UserListResponse }>('/api/v1/admin/users', { params }),

  getUser: (id: number) =>
    api.get<{ data: AdminUserDetail }>(`/api/v1/admin/users/${id}`),

  updateUser: (id: number, data: UpdateUserRequest) =>
    api.put<{ data: AdminUserDetail }>(`/api/v1/admin/users/${id}`, data),

  disableUser: (id: number) =>
    api.post(`/api/v1/admin/users/${id}/disable`),

  enableUser: (id: number) =>
    api.post(`/api/v1/admin/users/${id}/enable`),

  updateUserRole: (id: number, data: UpdateRoleRequest) =>
    api.put(`/api/v1/admin/users/${id}/role`, data),

  getBindings: (params?: BindingListQuery) =>
    api.get<{ data: BindingListResponse }>('/api/v1/admin/bindings', { params }),

  deleteBinding: (id: number) =>
    api.delete(`/api/v1/admin/bindings/${id}`),
}
