import { describe, expect, it } from 'vitest'
import { buildDashboardNextActions } from './nextActions'

describe('dashboard next actions', () => {
  it('suggests account setup and analysis actions from user state', () => {
    const actions = buildDashboardNextActions({
      phoneVerified: false,
      userType: 'parent',
      bindingCount: 0,
      membershipActive: false,
    })

    expect(actions.map((action) => action.key)).toEqual([
      'verify-phone',
      'bind-student',
      'review-membership',
      'continue-analysis',
    ])
    expect(actions.map((action) => action.href)).toEqual([
      '/profile?tab=profile-security',
      '/profile?tab=family-bindings',
      '/profile?tab=membership-orders',
      '/analysis',
    ])
  })

  it('omits completed setup actions', () => {
    const actions = buildDashboardNextActions({
      phoneVerified: true,
      userType: 'parent',
      bindingCount: 2,
      membershipActive: true,
    })

    expect(actions.map((action) => action.key)).toEqual(['continue-analysis'])
  })
})
