import { useEffect, useState } from 'react'
import { Alert, Card, Col, Row, Spin, Statistic, Typography } from 'antd'
import { BarChartOutlined, CloudServerOutlined, StopOutlined, TeamOutlined, UserAddOutlined, WalletOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { adminApi, type StatsResponse } from '@/services/admin'

const adminEntryItems = [
  {
    title: '用户管理',
    description: '搜索、编辑、启用、禁用用户，并管理会员等级和管理员权限。',
    href: '/admin/users',
    icon: <TeamOutlined />,
  },
  {
    title: '支付订单',
    description: '查看订单、Mock 支付、关闭订单和补发会员权益。',
    href: '/admin/payment/orders',
    icon: <WalletOutlined />,
  },
  {
    title: '数据库备份',
    description: '导出当前数据库快照（.dump），或上传备份文件恢复整个数据库。',
    href: '/admin/db/backup',
    icon: <CloudServerOutlined />,
  },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => setError('加载系统统计失败'))
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
      <Typography.Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
        管理概览
      </Typography.Title>
      <Typography.Text type="secondary">
        管理用户账号、会员权益和支付订单。
      </Typography.Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
        {adminEntryItems.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.href}>
            <Link to={item.href} style={{ display: 'block', height: '100%' }}>
              <Card hoverable bodyStyle={{ minHeight: 132, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="用户总数" value={stats?.total_users ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="正常用户"
              value={stats?.active_users ?? 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#16A34A' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="禁用用户"
              value={stats?.banned_users ?? 0}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#DC2626' }}
            />
          </Card>
        </Col>
      </Row>

      {stats?.users_by_role && (
        <Card title="按会员等级统计" style={{ marginTop: 24 }} extra={<BarChartOutlined />}>
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
