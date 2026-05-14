import type { MembershipPlan } from '@/services/membership'

/**
 * Given the list of plans and the `?plan=` query param value, returns the
 * plan_code that should be visually highlighted, or null if the hint is
 * missing or does not match any plan. Used by the membership page to anchor
 * users on the plan they just clicked from the paywall modal.
 */
export function selectHighlightedPlan(
  plans: readonly MembershipPlan[],
  planCodeHint: string | null,
): string | null {
  if (!planCodeHint) return null
  const match = plans.find((plan) => plan.plan_code === planCodeHint)
  return match ? match.plan_code : null
}
