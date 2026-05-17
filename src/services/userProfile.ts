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

// Snapshot 是后端 lookup 服务把 profile + 一分一段表 + 志愿数 合成的完整快照。
// 推荐算法 / AI agent 直接消费这个对象，前端不再自己拼 provincial_rank 和 plan_size。
export type RecommendationSnapshot = components['schemas']['snapshot.Snapshot']

export const userProfileApi = {
  get: () => api.get<{ data: UserProfile }>('/api/v1/me/profile'),

  update: (payload: UpsertProfileRequest) =>
    api.put<{ data: UserProfile }>('/api/v1/me/profile', payload),

  // Returns 422 when the profile is incomplete or when score-rank data is
  // unavailable for the current year and the previous year. UI should fall
  // back to the existing profile and prompt the user to finish the survey.
  snapshot: () =>
    api.get<{ data: RecommendationSnapshot }>('/api/v1/me/profile/snapshot'),
}
