export interface DashboardNextActionInput {
  phoneVerified: boolean
  membershipActive: boolean
}

export interface DashboardNextAction {
  key: 'verify-phone' | 'review-membership'
  title: string
  description: string
  href: string
}

export function buildDashboardNextActions(input: DashboardNextActionInput): DashboardNextAction[] {
  const actions: DashboardNextAction[] = []

  if (!input.phoneVerified) {
    actions.push({
      key: 'verify-phone',
      title: '完善手机号',
      description: '绑定并验证手机号，提升账号安全性。',
      href: '/profile?tab=profile-security',
    })
  }

  if (!input.membershipActive) {
    actions.push({
      key: 'review-membership',
      title: '查看会员状态',
      description: '了解可用套餐、权益状态和订单记录。',
      href: '/profile?tab=membership-orders',
    })
  }

  return actions
}
