import type { UserProfile } from '@/services/userProfile'

// Fields we forward to the AI agent's `recommendation_request` block. Mirrors
// the schema documented in agent.go (defaultSystemPrompt). Any field not in
// the source profile is omitted so we never pass `null`/empty values that
// would confuse the agent's parameter accumulator.
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

// Build the recommendation_request JSON payload from a saved profile. Returns
// null when the 4 required scalars are missing — callers should fall back to
// the normal "AI asks for basics" flow in that case.
export function buildRecommendationRequestPayload(profile: UserProfile | null | undefined): AgentRequestPayload | null {
  if (!profile) return null

  const hasRequired =
    !isEmpty(profile.region_code) &&
    !isEmpty(profile.subject_category_code) &&
    typeof profile.total_score === 'number' &&
    typeof profile.provincial_rank === 'number'

  if (!hasRequired) return null

  const payload: AgentRequestPayload = {}
  putIf(payload, 'region_code', profile.region_code)
  putIf(payload, 'subject_category_code', profile.subject_category_code)
  putIf(payload, 'total_score', profile.total_score)
  putIf(payload, 'provincial_rank', profile.provincial_rank)
  putIf(payload, 'plan_size', profile.plan_size)
  putIf(payload, 'priority_strategy', profile.priority_strategy)
  putIf(payload, 'math_score', profile.math_score)
  putIf(payload, 'physics_score', profile.physics_score)
  putIf(payload, 'chinese_score', profile.chinese_score)
  putIf(payload, 'english_score', profile.english_score)

  const prefs = profile.preferences
  if (prefs) {
    putIf(payload, 'required_majors', prefs.required_majors)
    putIf(payload, 'preferred_majors', prefs.preferred_majors)
    putIf(payload, 'excluded_majors', prefs.excluded_majors)
    putIf(payload, 'excluded_keywords', prefs.excluded_keywords)
    putIf(payload, 'preferred_cities', prefs.preferred_cities)
    putIf(payload, 'excluded_cities', prefs.excluded_cities)
    putIf(payload, 'preferred_provinces', prefs.preferred_provinces)
    putIf(payload, 'excluded_provinces', prefs.excluded_provinces)
    putIf(payload, 'holland_code', prefs.holland_code)
    putIf(payload, 'family_resources', prefs.family_resources)
    putIf(payload, 'family_economy', prefs.family_economy)
    putIf(payload, 'career_plans', prefs.career_plans)
    putIf(payload, 'budget_tuition_max', prefs.budget_tuition_max)
  }

  return payload
}

// Format any payload as a fenced `recommendation_request` Markdown block.
// Use this both for the profile-driven first-message injection AND for the
// "Generate plan" FAB so the two code paths share their wire format.
export function formatRecommendationRequestBlock(payload: AgentRequestPayload): string {
  return '```recommendation_request\n' + JSON.stringify(payload, null, 2) + '\n```'
}

// Build the request block from a saved user profile. Returns null when the
// 4 required scalars are missing.
export function buildRecommendationRequestBlock(profile: UserProfile | null | undefined): string | null {
  const payload = buildRecommendationRequestPayload(profile)
  if (!payload) return null
  return formatRecommendationRequestBlock(payload)
}

// Convenience for callers (handleSubmit) that already have a user-typed
// message — returns either `block\n\n<message>` or the original message.
export function prependRecommendationRequest(
  message: string,
  profile: UserProfile | null | undefined,
): string {
  const block = buildRecommendationRequestBlock(profile)
  if (!block) return message
  return block + '\n\n' + message
}
