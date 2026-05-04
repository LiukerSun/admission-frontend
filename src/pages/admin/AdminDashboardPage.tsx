import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Spin, Alert, Typography } from 'antd'
import {
  BarChartOutlined,
  TeamOutlined,
  UserAddOutlined,
  StopOutlined,
  LinkOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { adminApi, type StatsResponse } from '@/services/admin'

const adminEntryItems = [
  {
    title: '统计看板',
    description: '查看平台用户、绑定关系和会员等级分布。',
    href: '/admin/dashboard',
    icon: <BarChartOutlined />,
  },
  {
    title: '用户管理',
    description: '筛选用户、编辑会员等级和管理员权限。',
    href: '/admin/users',
    icon: <TeamOutlined />,
  },
  {
    title: '绑定管理',
    description: '查看和处理家长与学生绑定关系。',
    href: '/admin/bindings',
    icon: <LinkOutlined />,
  },
  {
    title: '支付订单',
    description: '查看订单、处理支付状态和权益发放。',
    href: '/admin/payment/orders',
    icon: <WalletOutlined />,
  },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => setError('加载统计数据失败'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return <Alert message={error} type="error" />
  }

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>系统管理</h2>
      <Typography.Text type="secondary">
        进入后台管理功能，处理用户、绑定关系、支付订单和平台统计。
      </Typography.Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
        {adminEntryItems.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.href}>
            <Link to={item.href} style={{ display: 'block', height: '100%' }}>
              <Card
                hoverable
                bodyStyle={{ minHeight: 132, display: 'flex', gap: 14, alignItems: 'flex-start' }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1E40AF',
                    background: '#EFF6FF',
                    flex: '0 0 auto',
                    fontSize: 18,
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ minWidth: 0 }}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                    {item.title}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                    {item.description}
                  </Typography.Text>
                </span>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <h2>系统统计</h2>
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats?.total_users ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats?.active_users ?? 0}
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="封禁用户"
              value={stats?.banned_users ?? 0}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="绑定总数"
              value={stats?.total_bindings ?? 0}
              prefix={<LinkOutlined />}
            />
          </Card>
        </Col>
      </Row>
      {stats?.users_by_role && (
        <Card title="会员等级分布" style={{ marginTop: 24 }}>
          <Row gutter={[24, 24]}>
            {Object.entries(stats.users_by_role).map(([role, count]) => (
              <Col xs={12} sm={8} lg={6} key={role}>
                <Statistic title={role} value={count} />
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  )
}
