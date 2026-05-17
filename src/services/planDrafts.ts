import api from './api'
import type { VolunteerPlan } from './admission'

type Envelope<T> = { code: number; message?: string; data?: T }

export type PlanDraftStatus = 'generating' | 'ready' | 'failed' | 'adopted' | 'superseded'

export type PlanDraft = {
  id: number
  user_id: number
  conversation_id: number
  status: PlanDraftStatus
  input_json: unknown
  plan_json?: VolunteerPlan
  algorithm_version: string
  error?: string
  created_at: string
  updated_at: string
}

export const planDraftsApi = {
  get: (draftId: number) => api.get<Envelope<PlanDraft>>(`/api/v1/plan-drafts/${draftId}`),
  listByConversation: (conversationId: number) =>
    api.get<Envelope<PlanDraft[]>>(`/api/v1/conversations/${conversationId}/plan-drafts`),
}
