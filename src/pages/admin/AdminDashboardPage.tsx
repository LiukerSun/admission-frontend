import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Spin, Alert } from 'antd'
import {
  TeamOutlined,
  UserAddOutlined,
  StopOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { adminApi, type StatsResponse } from '@/services/admin'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    adminApi.getStats()
      .then((res) => { if (!cancelled) setStats(res.data.data) })
      .catch((err) => { console.error('Failed to load stats:', err); if (!cancelled) setError('加载统计数据失败') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
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
        <Card title="角色分布" style={{ marginTop: 24 }}>
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
