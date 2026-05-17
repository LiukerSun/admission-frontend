import api from './api'
import type { VolunteerPlan } from './admission'

type Envelope<T> = { code: number; message?: string; data?: T }

// 完整方案（详情查询专用）。plan_json 是大对象（~30-60 KB），不要放进列表请求。
export type UserVolunteerPlan = {
  id: number
  user_id: number
  title: string
  description: string
  source_draft_id?: number
  plan_json: VolunteerPlan
  created_at: string
  updated_at: string
}

// 列表用的轻量摘要。后端 GET /volunteer-plans 返回这一份，前端 lazy-load
// 详情时再走 get(id)。school_count / group_count 直接从 plan_json->stats 取，
// 老数据没 stats 时回退 0。description 也带上（≤500 字符，影响轻），列表项能
// 显示真实持久化的备注。
export type UserVolunteerPlanSummary = {
  id: number
  title: string
  description: string
  school_count: number
  group_count: number
  created_at: string
  updated_at: string
}

// PATCH 入参：字段未传 (undefined) 表示不动；空串表示清空（仅 description 允许）。
export type UpdatePlanMetaRequest = {
  title?: string
  description?: string
}

export const volunteerPlansApi = {
  list: () => api.get<Envelope<UserVolunteerPlanSummary[]>>('/api/v1/volunteer-plans'),
  get: (id: number) => api.get<Envelope<UserVolunteerPlan>>(`/api/v1/volunteer-plans/${id}`),
  update: (id: number, payload: UpdatePlanMetaRequest) =>
    api.patch<Envelope<UserVolunteerPlan>>(`/api/v1/volunteer-plans/${id}`, payload),
  // 软删除：后端 set deleted_at = NOW()，数据保留可恢复。
  remove: (id: number) =>
    api.delete<Envelope<{ deleted: boolean; id: number }>>(`/api/v1/volunteer-plans/${id}`),
  adopt: (draft_id: number, title?: string) =>
    api.post<Envelope<UserVolunteerPlan>>('/api/v1/volunteer-plans/adopt', { draft_id, title }),
}
