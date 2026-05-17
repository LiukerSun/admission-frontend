import type { RecommendationSnapshot, UserProfile } from '@/services/userProfile'

// Fields we forward to the AI agent's `recommendation_request` block. Mirrors
// the schema documented in agent.go (defaultSystemPrompt).
//
// migration 008 之后 user_profiles 上的偏好字段全删了；snapshot 也不再含
// preferences。本 block 只注入 6 个核心字段（4 项问卷 + 后端换算的 rank/plan_size），
// 其余偏好由 LLM 在对话中现问，通过 tool 直接进入 recommendation_service。
type AgentRequestPayload = Record<string, unknown>

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function putIf(out: AgentRequestPayload, key: string, value: unknown) {
  if (isEmpty(value)) return
  out[key] = value
}

// Build the recommendation_request JSON payload from the backend snapshot.
// 返回 null 当必填项不全 —— 调用方应该 fall back 到「让 AI 主动询问」流程。
//
// 设计：snapshot 是「权威源」，profile 现在只是 snapshot 失败时的最弱回退。
// snapshot 失败时（用户没填完问卷 / lookup 数据缺）profile 上也只有同样这 4 项
// 核心信息，所以走 profile 路径不会更糟。
export function buildRecommendationRequestPayload(
  profile: UserProfile | null | undefined,
  snapshot?: RecommendationSnapshot | null,
): AgentRequestPayload | null {
  // snapshot 在 → 必填项已被后端验证通过
  if (snapshot && snapshot.provincial_rank > 0 && snapshot.total_score > 0) {
    return {
      region_code: snapshot.region_code,
      subject_category_code: snapshot.subject_category_code,
      total_score: snapshot.total_score,
      provincial_rank: snapshot.provincial_rank,
      plan_size: snapshot.plan_size,
      elective_subjects: snapshot.elective_subjects,
    }
  }

  // 回退路径：profile 直接构造（无后端换算的 rank/plan_size）。仅在 snapshot
  // 拉取失败时进入，且必须满足问卷四项必填。
  if (!profile) return null
  const hasRequired =
    !isEmpty(profile.region_code) &&
    !isEmpty(profile.subject_category_code) &&
    typeof profile.total_score === 'number' &&
    !isEmpty(profile.elective_subjects)
  if (!hasRequired) return null

  const payload: AgentRequestPayload = {}
  putIf(payload, 'region_code', profile.region_code)
  putIf(payload, 'subject_category_code', profile.subject_category_code)
  putIf(payload, 'total_score', profile.total_score)
  putIf(payload, 'elective_subjects', profile.elective_subjects)
  return payload
}

// Format any payload as a fenced `recommendation_request` Markdown block.
// Use this both for the profile-driven first-message injection AND for the
// "Generate plan" FAB so the two code paths share their wire format.
export function formatRecommendationRequestBlock(payload: AgentRequestPayload): string {
  return '```recommendation_request\n' + JSON.stringify(payload, null, 2) + '\n```'
}

// Build the request block from a saved user profile + optional backend snapshot.
// Returns null when the required fields are missing.
export function buildRecommendationRequestBlock(
  profile: UserProfile | null | undefined,
  snapshot?: RecommendationSnapshot | null,
): string | null {
  const payload = buildRecommendationRequestPayload(profile, snapshot)
  if (!payload) return null
  return formatRecommendationRequestBlock(payload)
}

// Convenience for callers (handleSubmit) that already have a user-typed
// message — returns either `block\n\n<message>` or the original message.
export function prependRecommendationRequest(
  message: string,
  profile: UserProfile | null | undefined,
  snapshot?: RecommendationSnapshot | null,
): string {
  const block = buildRecommendationRequestBlock(profile, snapshot)
  if (!block) return message
  return block + '\n\n' + message
}
