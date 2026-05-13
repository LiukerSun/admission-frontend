import { beforeEach, describe, expect, it } from 'vitest'
import { usePaywallStore } from './paywallStore'

describe('paywallStore', () => {
  beforeEach(() => {
    usePaywallStore.getState().closePaywall()
  })

  it('starts closed with no metadata', () => {
    const state = usePaywallStore.getState()
    expect(state.open).toBe(false)
    expect(state.recommendedPlan).toBeUndefined()
    expect(state.reason).toBeUndefined()
    expect(state.featureName).toBeUndefined()
    expect(state.trigger).toBeUndefined()
  })

  it('openPaywall sets open=true and captures metadata', () => {
    usePaywallStore.getState().openPaywall({
      recommendedPlan: 'quarterly',
      reason: 'membership_required',
      featureName: '智能填报',
      trigger: 'pre_check',
    })

    const state = usePaywallStore.getState()
    expect(state.open).toBe(true)
    expect(state.recommendedPlan).toBe('quarterly')
    expect(state.reason).toBe('membership_required')
    expect(state.featureName).toBe('智能填报')
    expect(state.trigger).toBe('pre_check')
  })

  it('openPaywall defaults trigger to "manual" when omitted', () => {
    usePaywallStore.getState().openPaywall()
    expect(usePaywallStore.getState().trigger).toBe('manual')
  })

  it('openPaywall is a no-op when already open (prevents stacking)', () => {
    usePaywallStore.getState().openPaywall({ recommendedPlan: 'monthly', featureName: 'first' })
    usePaywallStore.getState().openPaywall({ recommendedPlan: 'yearly', featureName: 'second' })

    const state = usePaywallStore.getState()
    expect(state.open).toBe(true)
    expect(state.recommendedPlan).toBe('monthly')
    expect(state.featureName).toBe('first')
  })

  it('closePaywall resets all metadata', () => {
    usePaywallStore.getState().openPaywall({
      recommendedPlan: 'quarterly',
      featureName: '智能填报',
    })
    usePaywallStore.getState().closePaywall()

    const state = usePaywallStore.getState()
    expect(state.open).toBe(false)
    expect(state.recommendedPlan).toBeUndefined()
    expect(state.featureName).toBeUndefined()
  })
})
