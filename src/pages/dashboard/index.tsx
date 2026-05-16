import { type ReactNode, useEffect, useState } from 'react'
import { Button, Card, Col, Divider, Progress, Row, Space, Statistic, Tag, Typography } from 'antd'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  DashboardOutlined,
  FormOutlined,
  MobileOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { membershipApi } from '@/services/membership'
import { useUserProfileStore } from '@/stores/userProfileStore'
import { buildDashboardNextActions, type DashboardNextAction } from '@/utils/nextActions'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [membershipActive, setMembershipActive] = useState(false)
  const {
    hasCompletedProfile,
    filledCount,
    totalCount,
    loadProfile,
  } = useUserProfileStore()

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
    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [user, loadProfile])

  const surveyProgressPercent = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100)

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

      <Card
        bordered={false}
        style={{
          marginTop: 24,
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          color: '#fff',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: 28 }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <Space size="small" align="center" style={{ marginBottom: 8 }}>
              <FormOutlined style={{ color: '#FBBF24', fontSize: 20 }} />
              <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
                高考志愿调查问卷
              </Typography.Title>
              <Tag color={hasCompletedProfile ? 'green' : 'orange'} style={{ marginLeft: 4 }}>
                {hasCompletedProfile ? '已完成 · 可编辑' : '尚未填写'}
              </Tag>
            </Space>
            <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 12 }}>
              一次填好基础信息，<strong>智能填报</strong>新对话时 AI 自动读取，不用再重复输入。
            </Typography.Paragraph>
            <div style={{ maxWidth: 320 }}>
              <Progress
                percent={surveyProgressPercent}
                strokeColor={{ from: '#FBBF24', to: '#FFFFFF' }}
                trailColor="rgba(255,255,255,0.25)"
                showInfo={false}
                size={[null, 8] as unknown as number}
              />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                完成度 {filledCount}/{totalCount}
              </Typography.Text>
            </div>
          </div>
          <div>
            <Link to="/profile-survey">
              <Button size="large" type="primary" style={{ background: '#fff', color: '#1E40AF', borderColor: '#fff' }} icon={<ArrowRightOutlined />}>
                {hasCompletedProfile ? '编辑问卷' : '立即填写'}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

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
