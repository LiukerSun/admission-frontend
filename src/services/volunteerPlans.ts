import api from './api'
import type { VolunteerPlan } from './admission'

type Envelope<T> = { code: number; message?: string; data?: T }

export type UserVolunteerPlan = {
  id: number
  user_id: number
  title: string
  source_draft_id?: number
  plan_json: VolunteerPlan
  created_at: string
  updated_at: string
}

export const volunteerPlansApi = {
  list: () => api.get<Envelope<UserVolunteerPlan[]>>('/api/v1/volunteer-plans'),
  get: (id: number) => api.get<Envelope<UserVolunteerPlan>>(`/api/v1/volunteer-plans/${id}`),
  adopt: (draft_id: number, title?: string) =>
    api.post<Envelope<UserVolunteerPlan>>('/api/v1/volunteer-plans/adopt', { draft_id, title }),
}

