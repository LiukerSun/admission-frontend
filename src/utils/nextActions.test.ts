import { describe, expect, it } from 'vitest'
import { buildDashboardNextActions } from './nextActions'

describe('dashboard next actions', () => {
  it('suggests account setup and analysis actions from user state', () => {
    const actions = buildDashboardNextActions({
      phoneVerified: false,
      membershipActive: false,
    })

    expect(actions.map((action) => action.key)).toEqual([
      'verify-phone',
      'review-membership',
    ])
    expect(actions.map((action) => action.href)).toEqual([
      '/profile?tab=profile-security',
      '/profile?tab=membership-orders',
    ])
  })

  it('omits completed setup actions', () => {
    const actions = buildDashboardNextActions({
      phoneVerified: true,
      membershipActive: true,
    })

    expect(actions.map((action) => action.key)).toEqual([])
  })
})
