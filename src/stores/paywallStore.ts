import { create } from 'zustand'

export type PaywallTrigger = 'api_403' | 'pre_check' | 'manual'

interface PaywallOpenOptions {
  recommendedPlan?: string
  reason?: string
  featureName?: string
  trigger?: PaywallTrigger
}

interface PaywallState {
  open: boolean
  recommendedPlan?: string
  reason?: string
  featureName?: string
  trigger?: PaywallTrigger
  openPaywall: (opts?: PaywallOpenOptions) => void
  closePaywall: () => void
}

export const usePaywallStore = create<PaywallState>((set, get) => ({
  open: false,
  recommendedPlan: undefined,
  reason: undefined,
  featureName: undefined,
  trigger: undefined,

  openPaywall: (opts) => {
    if (get().open) return
    set({
      open: true,
      recommendedPlan: opts?.recommendedPlan,
      reason: opts?.reason,
      featureName: opts?.featureName,
      trigger: opts?.trigger ?? 'manual',
    })
  },

  closePaywall: () => {
    set({
      open: false,
      recommendedPlan: undefined,
      reason: undefined,
      featureName: undefined,
      trigger: undefined,
    })
  },
}))
