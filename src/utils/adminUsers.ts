import type { UpdateUserRequest } from '@/services/admin'

export interface EditableAdminUser {
  id: number
  email: string
  username?: string
  role: 'user' | 'premium'
  is_admin?: boolean
  user_type: 'parent' | 'student'
  status: 'active' | 'banned'
}

export interface AdminUserEditValues {
  email: string
  username?: string
  role: 'user' | 'premium'
  is_admin: boolean
  user_type: 'parent' | 'student'
  status: 'active' | 'banned'
}

export function canChangeAdminPermission(targetUserId: number | undefined, currentUserId: number | undefined) {
  return targetUserId !== undefined && targetUserId !== currentUserId
}

export function buildAdminUserUpdatePayload(
  original: EditableAdminUser,
  values: AdminUserEditValues,
  currentUserId: number | undefined,
): UpdateUserRequest {
  const payload: UpdateUserRequest = {}
  const email = values.email.trim()
  const username = values.username?.trim()

  if (email !== original.email) payload.email = email
  if ((username || '') !== (original.username || '')) payload.username = username || undefined
  if (values.role !== original.role) payload.role = values.role
  if (
    canChangeAdminPermission(original.id, currentUserId) &&
    values.is_admin !== Boolean(original.is_admin)
  ) {
    payload.is_admin = values.is_admin
  }
  if (values.user_type !== original.user_type) payload.user_type = values.user_type
  if (values.status !== original.status) payload.status = values.status

  return payload
}
