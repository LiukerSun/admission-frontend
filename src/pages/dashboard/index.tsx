import { useEffect, useRef, useState } from 'react'
import { Card, Statistic, Row, Col, Spin, Divider } from 'antd'
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
import * as echarts from 'echarts'
import { DataPanel, MetricCard, PageHeader } from '@/components/ui'

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current)
    chart.setOption({
      grid: { top: 4, right: 4, bottom: 4, left: 4 },
      xAxis: { show: false, type: 'category', data: data.map((_, i) => i) },
      yAxis: { show: false, type: 'value' },
      series: [{
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color },
        areaStyle: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + '33' },
            { offset: 1, color: color + '05' },
          ]),
        },
      }],
    })
    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [data, color])

  return <div ref={chartRef} style={{ width: '100%', height: 48 }} />
}

export default function DashboardPage() {
  const { isAdmin } = useAuthStore()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await adminApi.getStats()
        if (!cancelled) setStats(res.data.data)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
      setStats(null)
      setLoading(false)
    }
  }, [isAdmin])

  const sparkData = [12, 18, 15, 25, 22, 30, 35]
  const sparkData2 = [8, 12, 10, 14, 18, 16, 20]
  const sparkData3 = [3, 2, 4, 3, 5, 4, 6]

  if (isAdmin && loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow={isAdmin ? '系统管理' : '我的工作台'}
        title={isAdmin ? '平台控制台' : '我的控制台'}
        description={isAdmin ? '查看平台整体运行数据和用户活跃度。' : '查看你的志愿填报进度、收藏数据和下一步操作。'}
      />

      {isAdmin ? (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <MetricCard title="总用户数" value={stats?.total_users ?? 0} icon={<TeamOutlined />} trend={12.5} trendLabel="较上月">
                <Sparkline data={sparkData} color="#1E40AF" />
              </MetricCard>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <MetricCard title="活跃用户" value={stats?.active_users ?? 0} icon={<UserAddOutlined />} tone="amber" trend={8.3} trendLabel="较上月">
                <Sparkline data={sparkData2} color="#D97706" />
              </MetricCard>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <MetricCard title="绑定总数" value={stats?.total_bindings ?? 0} icon={<LinkOutlined />} tone="green" trend={-2.1} trendLabel="较上月">
                <Sparkline data={sparkData3} color="#16A34A" />
              </MetricCard>
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
        </>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <MetricCard title="已完成分析" value={12} icon={<BarChartOutlined />} trend={20} trendLabel="较上周">
                <Sparkline data={[5, 8, 6, 10, 12, 11, 12]} color="#1E40AF" />
              </MetricCard>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <MetricCard title="收藏院校" value={5} icon={<LineChartOutlined />} tone="amber" trend={0} trendLabel="较上周">
                <Sparkline data={[3, 4, 4, 5, 5, 5, 5]} color="#D97706" />
              </MetricCard>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <MetricCard title="对比方案" value={3} icon={<PieChartOutlined />} tone="green" trend={50} trendLabel="较上周">
                <Sparkline data={[1, 1, 2, 2, 3, 3, 3]} color="#16A34A" />
              </MetricCard>
            </Col>
          </Row>

          <Divider style={{ margin: '32px 0' }} />

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="志愿填报进度">
                <div style={{ padding: '24px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>院校调研</span>
                    <span style={{ color: '#1E40AF', fontWeight: 600 }}>80%</span>
                  </div>
                  <div style={{ height: 8, background: '#E9EEF6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '80%', height: '100%', background: '#1E40AF', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ padding: '24px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>专业分析</span>
                    <span style={{ color: '#D97706', fontWeight: 600 }}>60%</span>
                  </div>
                  <div style={{ height: 8, background: '#E9EEF6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: '#D97706', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ padding: '24px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>志愿模拟</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>40%</span>
                  </div>
                  <div style={{ height: 8, background: '#E9EEF6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '40%', height: '100%', background: '#16A34A', borderRadius: 4 }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="快捷入口">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a href="/analysis" style={{ display: 'block', padding: '12px 16px', background: '#EFF6FF', borderRadius: 6, color: '#1E40AF', textDecoration: 'none', fontWeight: 500 }}>
                    查看数据分析 &rarr;
                  </a>
                  <a href="/membership" style={{ display: 'block', padding: '12px 16px', background: '#FDF2F8', borderRadius: 6, color: '#BE185D', textDecoration: 'none', fontWeight: 500 }}>
                    开通会员服务 &rarr;
                  </a>
                  <a href="/orders" style={{ display: 'block', padding: '12px 16px', background: '#F8FAFC', borderRadius: 6, color: '#334155', textDecoration: 'none', fontWeight: 500 }}>
                    查看我的订单 &rarr;
                  </a>
                  <a href="/bindings" style={{ display: 'block', padding: '12px 16px', background: '#FEF3C7', borderRadius: 6, color: '#D97706', textDecoration: 'none', fontWeight: 500 }}>
                    管理绑定关系 &rarr;
                  </a>
                  <a href="/profile" style={{ display: 'block', padding: '12px 16px', background: '#ECFDF5', borderRadius: 6, color: '#16A34A', textDecoration: 'none', fontWeight: 500 }}>
                    完善个人资料 &rarr;
                  </a>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}
