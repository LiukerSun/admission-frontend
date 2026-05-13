import { usePaywallStore, type PaywallTrigger } from '@/stores/paywallStore'
import { useAuthStore } from '@/stores/authStore'

export const PAYWALL_CODE = 1010 as const

export interface PaywallResponseData {
  reason?: string
  required_level?: string
  recommended_plan?: string
  checkout_url?: string
}

export interface PaywallResponse {
  code: typeof PAYWALL_CODE
  message?: string
  data?: PaywallResponseData
}

export function isPaywallResponse(value: unknown): value is PaywallResponse {
  if (!value || typeof value !== 'object') return false
  const code = (value as { code?: unknown }).code
  return code === PAYWALL_CODE
}

/**
 * Safely parse a raw response body string into a PaywallResponse. Returns
 * null if the body is not valid JSON, not an object, or not a paywall
 * payload. Used by the SSE path where the fetch response is not wrapped
 * by axios so we cannot rely on the response interceptor.
 */
export function tryParsePaywallText(text: string): PaywallResponse | null {
  try {
    const parsed: unknown = JSON.parse(text)
    return isPaywallResponse(parsed) ? parsed : null
  } catch {
    return null
  }
}

interface TriggerOptions {
  trigger?: PaywallTrigger
  featureName?: string
}

export function triggerPaywallIfMatch(value: unknown, opts?: TriggerOptions): boolean {
  if (!isPaywallResponse(value)) return false
  usePaywallStore.getState().openPaywall({
    recommendedPlan: value.data?.recommended_plan,
    reason: value.data?.reason,
    featureName: opts?.featureName,
    trigger: opts?.trigger ?? 'api_403',
  })
  // Refresh cached membership so subsequent gated actions reflect any
  // server-side state change (e.g. expiry). Single source of truth — callers
  // (axios interceptor, SSE handler) no longer need to call this themselves.
  void useAuthStore.getState().refreshMembership().catch(() => undefined)
  return true
}
