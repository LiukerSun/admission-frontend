import api from './api'

export interface MembershipPlan {
  id: number
  plan_code: 'monthly' | 'quarterly' | 'yearly' | string
  plan_name: string
  membership_level: string
  duration_days: number
  price_amount: number
  currency: string
  status: 'active' | 'inactive' | string
}

export interface CurrentMembership {
  membership_level: string
  status: 'inactive' | 'active' | 'expired' | string
  started_at?: string
  ends_at?: string
  active: boolean
}

export const membershipApi = {
  getPlans: () =>
    api.get<{ data: MembershipPlan[] }>('/api/v1/membership/plans'),

  getCurrent: () =>
    api.get<{ data: CurrentMembership }>('/api/v1/membership'),
}
