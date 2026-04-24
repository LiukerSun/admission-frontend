import { useEffect, useRef, useState } from 'react'
import { Card, Statistic, Row, Col, Spin, Divider } from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserAddOutlined,
  LinkOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { adminApi, type StatsResponse } from '@/services/admin'
import * as echarts from 'echarts'

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

function TrendTag({ value }: { value: number }) {
  const isUp = value >= 0
  return (
    <span style={{ color: isUp ? '#16A34A' : '#DC2626', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {isUp ? <RiseOutlined /> : <FallOutlined />}
      {Math.abs(value)}%
    </span>
  )
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
      <h2 style={{ marginBottom: 4 }}>{isAdmin ? '平台控制台' : '我的控制台'}</h2>
      <p style={{ color: '#64748B', marginBottom: 24 }}>
        {isAdmin ? '查看平台整体运行数据和用户活跃度' : '查看你的志愿填报进度和收藏数据'}
      </p>

      {isAdmin ? (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <Card bodyStyle={{ paddingBottom: 12 }}>
                <Statistic
                  title={<span style={{ fontSize: 13, color: '#64748B' }}>总用户数</span>}
                  value={stats?.total_users ?? 0}
                  prefix={<TeamOutlined style={{ color: '#1E40AF' }} />}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <TrendTag value={12.5} />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>较上月</span>
                </div>
                <Sparkline data={sparkData} color="#1E40AF" />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card bodyStyle={{ paddingBottom: 12 }}>
                <Statistic
                  title={<span style={{ fontSize: 13, color: '#64748B' }}>活跃用户</span>}
                  value={stats?.active_users ?? 0}
                  prefix={<UserAddOutlined style={{ color: '#D97706' }} />}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <TrendTag value={8.3} />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>较上月</span>
                </div>
                <Sparkline data={sparkData2} color="#D97706" />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card bodyStyle={{ paddingBottom: 12 }}>
                <Statistic
                  title={<span style={{ fontSize: 13, color: '#64748B' }}>绑定总数</span>}
                  value={stats?.total_bindings ?? 0}
                  prefix={<LinkOutlined style={{ color: '#16A34A' }} />}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <TrendTag value={-2.1} />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>较上月</span>
                </div>
                <Sparkline data={sparkData3} color="#16A34A" />
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
        </>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <Card bodyStyle={{ paddingBottom: 12 }}>
                <Statistic
                  title={<span style={{ fontSize: 13, color: '#64748B' }}>已完成分析</span>}
                  value={12}
                  prefix={<BarChartOutlined style={{ color: '#1E40AF' }} />}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <TrendTag value={20} />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>较上周</span>
                </div>
                <Sparkline data={[5, 8, 6, 10, 12, 11, 12]} color="#1E40AF" />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card bodyStyle={{ paddingBottom: 12 }}>
                <Statistic
                  title={<span style={{ fontSize: 13, color: '#64748B' }}>收藏院校</span>}
                  value={5}
                  prefix={<LineChartOutlined style={{ color: '#D97706' }} />}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <TrendTag value={0} />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>较上周</span>
                </div>
                <Sparkline data={[3, 4, 4, 5, 5, 5, 5]} color="#D97706" />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card bodyStyle={{ paddingBottom: 12 }}>
                <Statistic
                  title={<span style={{ fontSize: 13, color: '#64748B' }}>对比方案</span>}
                  value={3}
                  prefix={<PieChartOutlined style={{ color: '#16A34A' }} />}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <TrendTag value={50} />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>较上周</span>
                </div>
                <Sparkline data={[1, 1, 2, 2, 3, 3, 3]} color="#16A34A" />
              </Card>
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
