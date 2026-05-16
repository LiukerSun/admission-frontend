import api from './api'
import type { components } from '@/types/api'

// Re-exported from generated OpenAPI types so consumers never reach into the
// schema map directly.
export type Preferences = components['schemas']['userprofile.Preferences']
export type UpsertProfileRequest = components['schemas']['userprofile.UpsertRequest']

// The backend response envelope is { data: ProfileResponse }. We do not have
// a generated type for ProfileResponse yet (it embeds Profile + Completed),
// so describe the shape we actually consume here.
export interface UserProfile extends UpsertProfileRequest {
  user_id: number
  completed: boolean
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export const userProfileApi = {
  get: () => api.get<{ data: UserProfile }>('/api/v1/me/profile'),

  update: (payload: UpsertProfileRequest) =>
    api.put<{ data: UserProfile }>('/api/v1/me/profile', payload),
}
