import { useEffect, useState } from 'react'
import { Statistic, Row, Col, Spin, Alert } from 'antd'
import {
  TeamOutlined,
  UserAddOutlined,
  StopOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { adminApi, type StatsResponse } from '@/services/admin'
import { DataPanel, MetricCard, PageHeader } from '@/components/ui'

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
      <PageHeader eyebrow="系统管理" title="系统统计" description="查看用户、活跃度、封禁和绑定关系的整体状态。" />
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="总用户数" value={stats?.total_users ?? 0} icon={<TeamOutlined />} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="活跃用户" value={stats?.active_users ?? 0} icon={<UserAddOutlined />} tone="green" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="封禁用户" value={stats?.banned_users ?? 0} icon={<StopOutlined />} tone="red" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="绑定总数" value={stats?.total_bindings ?? 0} icon={<LinkOutlined />} tone="amber" />
        </Col>
      </Row>
      {stats?.users_by_role && (
        <DataPanel title="角色分布" style={{ marginTop: 24 }}>
          <Row gutter={[24, 24]}>
            {Object.entries(stats.users_by_role).map(([role, count]) => (
              <Col xs={12} sm={8} lg={6} key={role}>
                <Statistic title={role} value={count} />
              </Col>
            ))}
          </Row>
        </DataPanel>
      )}
    </div>
  )
}
