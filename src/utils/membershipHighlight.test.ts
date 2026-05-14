import { describe, expect, it } from 'vitest'
import { selectHighlightedPlan } from './membershipHighlight'
import type { MembershipPlan } from '@/services/membership'

const PLANS: MembershipPlan[] = [
  {
    id: 1,
    plan_code: 'monthly',
    plan_name: '月卡',
    membership_level: 'premium',
    duration_days: 30,
    price_amount: 990,
    currency: 'CNY',
    status: 'active',
  },
  {
    id: 2,
    plan_code: 'quarterly',
    plan_name: '季卡',
    membership_level: 'premium',
    duration_days: 90,
    price_amount: 2590,
    currency: 'CNY',
    status: 'active',
  },
  {
    id: 3,
    plan_code: 'yearly',
    plan_name: '年卡',
    membership_level: 'premium',
    duration_days: 365,
    price_amount: 8900,
    currency: 'CNY',
    status: 'active',
  },
]

describe('selectHighlightedPlan', () => {
  it('returns the matching plan code when query param is valid', () => {
    expect(selectHighlightedPlan(PLANS, 'quarterly')).toBe('quarterly')
    expect(selectHighlightedPlan(PLANS, 'monthly')).toBe('monthly')
  })

  it('returns null when query param is null or empty', () => {
    expect(selectHighlightedPlan(PLANS, null)).toBeNull()
    expect(selectHighlightedPlan(PLANS, '')).toBeNull()
  })

  it('returns null when query param does not match any plan', () => {
    expect(selectHighlightedPlan(PLANS, 'unknown')).toBeNull()
  })

  it('returns null when plans list is empty', () => {
    expect(selectHighlightedPlan([], 'quarterly')).toBeNull()
  })

  it('is case-sensitive (returns null for mismatched casing)', () => {
    expect(selectHighlightedPlan(PLANS, 'Quarterly')).toBeNull()
  })
})
