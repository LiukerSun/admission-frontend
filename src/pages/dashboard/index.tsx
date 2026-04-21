import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Spin } from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserAddOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { adminApi, type StatsResponse } from '@/services/admin'

export default function DashboardPage() {
  const { isAdmin } = useAuthStore()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    let cancelled = false

    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const res = await adminApi.getStats()
        if (!cancelled) {
          setStats(res.data.data)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isAdmin])

  if (isAdmin && loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <h2>控制台</h2>
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {isAdmin && stats ? (
          <>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={stats.total_users ?? 0}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={stats.active_users ?? 0}
                  prefix={<UserAddOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="绑定总数"
                  value={stats.total_bindings ?? 0}
                  prefix={<LinkOutlined />}
                />
              </Card>
            </Col>
          </>
        ) : (
          <>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="已完成分析"
                  value={12}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="收藏院校"
                  value={5}
                  prefix={<LineChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="对比方案"
                  value={3}
                  prefix={<PieChartOutlined />}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>
    </div>
  )
}
