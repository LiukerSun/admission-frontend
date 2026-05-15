import api from './api'
import type { components } from '@/types/api'

export type StatsResponse = components['schemas']['admin.StatsResponse']
export type UserListResponse = components['schemas']['admin.UserListResponse']
export type UserListItem = components['schemas']['admin.UserListItem']
export type UpdateRoleRequest = components['schemas']['admin.UpdateRoleRequest']

export type MembershipPlan = components['schemas']['membership.PlanResponse']
export type MembershipPlanCreate = components['schemas']['membership.PlanCreateRequest']
export type MembershipPlanUpdate = components['schemas']['membership.PlanUpdateRequest']
export type MembershipPlanDeleteResult = components['schemas']['membership.PlanDeleteResult']

export interface ResetPasswordRequest {
  new_password: string
}

export interface AdminUserDetail {
  id: number
  email: string
  username?: string
  role: 'user' | 'premium'
  is_admin?: boolean
  status: 'active' | 'banned'
  created_at: string
  updated_at: string
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  role?: 'user' | 'premium'
  is_admin?: boolean
  status?: 'active' | 'banned'
}

export interface UserListQuery {
  page?: number
  page_size?: number
  email?: string
  username?: string
  role?: string
  is_admin?: boolean
  status?: string
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

  resetPassword: (id: number, data: ResetPasswordRequest) =>
    api.put<{ data: { message: string } }>(`/api/v1/admin/users/${id}/password`, data),

  disableUser: (id: number) =>
    api.post(`/api/v1/admin/users/${id}/disable`),

  enableUser: (id: number) =>
    api.post(`/api/v1/admin/users/${id}/enable`),

  updateUserRole: (id: number, data: UpdateRoleRequest) =>
    api.put(`/api/v1/admin/users/${id}/role`, data),

  exportBackup: () =>
    api.get<Blob>('/api/v1/admin/db/backup', { responseType: 'blob' }),

  // ── Membership plans ─────────────────────────────────────────────────────
  listMembershipPlans: () =>
    api.get<{ data: MembershipPlan[] }>('/api/v1/admin/membership/plans'),

  getMembershipPlan: (id: number) =>
    api.get<{ data: MembershipPlan }>(`/api/v1/admin/membership/plans/${id}`),

  createMembershipPlan: (data: MembershipPlanCreate) =>
    api.post<{ data: MembershipPlan }>('/api/v1/admin/membership/plans', data),

  updateMembershipPlan: (id: number, data: MembershipPlanUpdate) =>
    api.put<{ data: MembershipPlan }>(`/api/v1/admin/membership/plans/${id}`, data),

  deleteMembershipPlan: (id: number) =>
    api.delete<{ data: MembershipPlanDeleteResult }>(`/api/v1/admin/membership/plans/${id}`),

  restoreBackup: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData()
    form.append('backup', file)
    return api.post<{ data: BackupRestoreResult }>('/api/v1/admin/db/restore', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      },
      // 恢复可能比较慢，给 30 分钟上限，与后端 ctx timeout 对齐
      timeout: 30 * 60 * 1000,
    })
  },
}

export interface BackupRestoreResult {
  filename: string
  size_bytes: number
  stderr_tail?: string
}
