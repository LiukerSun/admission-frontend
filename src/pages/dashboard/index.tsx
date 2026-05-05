import { type ReactNode, useEffect, useState } from 'react'
import { Button, Card, Col, Divider, Row, Statistic, Typography } from 'antd'
import {
  CheckCircleOutlined,
  CrownOutlined,
  DashboardOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { membershipApi } from '@/services/membership'
import { buildDashboardNextActions, type DashboardNextAction } from '@/utils/nextActions'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [membershipActive, setMembershipActive] = useState(false)

  useEffect(() => {
    if (!user) return

    let cancelled = false
    const run = async () => {
      try {
        const membershipRes = await membershipApi.getCurrent()
        if (!cancelled) setMembershipActive(Boolean(membershipRes.data.data?.active))
      } catch {
        if (!cancelled) setMembershipActive(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [user])

  const nextActions = user
    ? buildDashboardNextActions({
        phoneVerified: Boolean(user.phone_verified),
        membershipActive,
      })
    : []

  const nextActionIcons: Record<DashboardNextAction['key'], ReactNode> = {
    'verify-phone': <MobileOutlined />,
    'review-membership': <CrownOutlined />,
  }

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
        我的工作台
      </Typography.Title>
      <Typography.Text type="secondary">
        账号已可正常使用，你也可以继续完善安全验证和会员权益。
      </Typography.Text>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="账号"
              value="正常"
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#16A34A' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="手机号验证"
              value={user?.phone_verified ? '已验证' : '待验证'}
              prefix={<MobileOutlined />}
              valueStyle={{ color: user?.phone_verified ? '#16A34A' : '#D97706' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="会员"
              value={membershipActive ? '有效' : '普通'}
              prefix={<CrownOutlined />}
              valueStyle={{ color: membershipActive ? '#D97706' : '#64748B' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: '32px 0' }} />

      <Card title="推荐下一步">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nextActions.length === 0 && (
            <Typography.Text type="secondary">暂无待处理事项，可以直接开始使用系统。</Typography.Text>
          )}
          {nextActions.map((action) => (
            <Card key={action.key} size="small" bodyStyle={{ padding: 16 }} style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1E40AF',
                    background: '#EFF6FF',
                    flex: '0 0 auto',
                  }}
                >
                  {nextActionIcons[action.key]}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>
                    {action.title}
                  </div>
                  <div style={{ color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>
                    {action.description}
                  </div>
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    style={{ padding: 0, marginTop: 8, height: 'auto' }}
                  >
                    <Link to={action.href}>打开</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}
