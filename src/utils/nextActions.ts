export interface DashboardNextActionInput {
  phoneVerified: boolean
  userType: 'parent' | 'student'
  bindingCount: number
  membershipActive: boolean
}

export interface DashboardNextAction {
  key: 'verify-phone' | 'bind-student' | 'review-membership' | 'continue-analysis'
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

  if (input.userType === 'parent' && input.bindingCount === 0) {
    actions.push({
      key: 'bind-student',
      title: '绑定学生',
      description: '建立家长与学生关系，便于共同管理填报信息。',
      href: '/profile?tab=family-bindings',
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

  actions.push({
    key: 'continue-analysis',
    title: '继续数据分析',
    description: '回到院校、专业和分数相关分析流程。',
    href: '/analysis',
  })

  return actions
}
