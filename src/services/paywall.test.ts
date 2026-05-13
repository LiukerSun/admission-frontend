import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isPaywallResponse,
  tryParsePaywallText,
  triggerPaywallIfMatch,
  PAYWALL_CODE,
} from './paywall'
import { usePaywallStore } from '@/stores/paywallStore'
import { useAuthStore } from '@/stores/authStore'

describe('isPaywallResponse', () => {
  it('returns true for objects with code === 1010', () => {
    expect(isPaywallResponse({ code: PAYWALL_CODE })).toBe(true)
    expect(isPaywallResponse({ code: 1010, data: { reason: 'membership_required' } })).toBe(true)
  })

  it('returns false for non-1010 codes', () => {
    expect(isPaywallResponse({ code: 1003 })).toBe(false)
    expect(isPaywallResponse({ code: 0 })).toBe(false)
    expect(isPaywallResponse({ code: 500 })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isPaywallResponse(null)).toBe(false)
    expect(isPaywallResponse(undefined)).toBe(false)
    expect(isPaywallResponse('1010')).toBe(false)
    expect(isPaywallResponse(1010)).toBe(false)
  })

  it('returns false when code field missing', () => {
    expect(isPaywallResponse({ message: 'error' })).toBe(false)
    expect(isPaywallResponse({})).toBe(false)
  })
})

describe('tryParsePaywallText', () => {
  it('returns parsed payload for a valid paywall JSON string', () => {
    const text = JSON.stringify({
      code: 1010,
      message: 'active membership required',
      data: { reason: 'membership_required', recommended_plan: 'quarterly' },
    })

    const result = tryParsePaywallText(text)

    expect(result).not.toBeNull()
    expect(result?.code).toBe(PAYWALL_CODE)
    expect(result?.data?.recommended_plan).toBe('quarterly')
  })

  it('returns null for non-paywall JSON', () => {
    const text = JSON.stringify({ code: 1003, message: 'forbidden' })
    expect(tryParsePaywallText(text)).toBeNull()
  })

  it('returns null for malformed JSON without throwing', () => {
    expect(tryParsePaywallText('not json')).toBeNull()
    expect(tryParsePaywallText('')).toBeNull()
    expect(tryParsePaywallText('{')).toBeNull()
  })

  it('returns null for JSON that parses to non-object', () => {
    expect(tryParsePaywallText('null')).toBeNull()
    expect(tryParsePaywallText('1010')).toBeNull()
    expect(tryParsePaywallText('"1010"')).toBeNull()
    expect(tryParsePaywallText('[1, 2, 3]')).toBeNull()
  })
})

describe('triggerPaywallIfMatch', () => {
  beforeEach(() => {
    usePaywallStore.getState().closePaywall()
  })

  afterEach(() => {
    usePaywallStore.getState().closePaywall()
  })

  it('opens paywall and returns true when payload matches', () => {
    const result = triggerPaywallIfMatch({
      code: 1010,
      data: { reason: 'membership_required', recommended_plan: 'quarterly' },
    })

    expect(result).toBe(true)
    expect(usePaywallStore.getState().open).toBe(true)
    expect(usePaywallStore.getState().recommendedPlan).toBe('quarterly')
    expect(usePaywallStore.getState().reason).toBe('membership_required')
  })

  it('returns false and does not open paywall for non-1010 responses', () => {
    const result = triggerPaywallIfMatch({ code: 1003, message: 'forbidden' })

    expect(result).toBe(false)
    expect(usePaywallStore.getState().open).toBe(false)
  })

  it('returns false for malformed payloads without throwing', () => {
    expect(triggerPaywallIfMatch(null)).toBe(false)
    expect(triggerPaywallIfMatch(undefined)).toBe(false)
    expect(triggerPaywallIfMatch('not an object')).toBe(false)
    expect(triggerPaywallIfMatch({})).toBe(false)
    expect(usePaywallStore.getState().open).toBe(false)
  })

  it('uses api_403 as default trigger', () => {
    triggerPaywallIfMatch({ code: 1010 })
    expect(usePaywallStore.getState().trigger).toBe('api_403')
  })

  it('honors trigger override and featureName option', () => {
    triggerPaywallIfMatch({ code: 1010 }, { trigger: 'pre_check', featureName: '推荐' })
    const state = usePaywallStore.getState()
    expect(state.trigger).toBe('pre_check')
    expect(state.featureName).toBe('推荐')
  })

  it('does not re-open paywall if already open', () => {
    usePaywallStore.getState().openPaywall({ recommendedPlan: 'monthly' })
    triggerPaywallIfMatch({ code: 1010, data: { recommended_plan: 'yearly' } })

    expect(usePaywallStore.getState().recommendedPlan).toBe('monthly')
  })

  it('calls authStore.refreshMembership when paywall is triggered', () => {
    const refreshSpy = vi.fn().mockResolvedValue(null)
    const original = useAuthStore.getState().refreshMembership
    useAuthStore.setState({ refreshMembership: refreshSpy })

    try {
      triggerPaywallIfMatch({ code: 1010 })
      expect(refreshSpy).toHaveBeenCalledTimes(1)
    } finally {
      useAuthStore.setState({ refreshMembership: original })
    }
  })

  it('does not call refreshMembership for non-paywall responses', () => {
    const refreshSpy = vi.fn().mockResolvedValue(null)
    const original = useAuthStore.getState().refreshMembership
    useAuthStore.setState({ refreshMembership: refreshSpy })

    try {
      triggerPaywallIfMatch({ code: 1003 })
      expect(refreshSpy).not.toHaveBeenCalled()
    } finally {
      useAuthStore.setState({ refreshMembership: original })
    }
  })

  it('swallows refreshMembership rejection without throwing', () => {
    const refreshSpy = vi.fn().mockRejectedValue(new Error('network down'))
    const original = useAuthStore.getState().refreshMembership
    useAuthStore.setState({ refreshMembership: refreshSpy })

    try {
      expect(() => triggerPaywallIfMatch({ code: 1010 })).not.toThrow()
      expect(refreshSpy).toHaveBeenCalled()
    } finally {
      useAuthStore.setState({ refreshMembership: original })
    }
  })
})
