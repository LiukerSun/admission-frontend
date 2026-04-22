import { Card, Row, Col, Spin, Tabs } from 'antd'
import { useEffect, useRef, useState, useMemo } from 'react'
import * as echarts from 'echarts'
import api from '@/services/api'

// ---------- 后端实际返回的数据结构 ----------

interface EnrollmentPlan {
  id?: number
  school_name?: string
  major_name?: string
  province?: string
  year?: number
  plan_count?: number
  actual_count?: number
  min_score?: number
  average_score?: number
  max_score?: number
  batch?: string
  major_code?: string
  school_code?: string
  subject_require?: string
}

interface EnrollmentResponse {
  page?: number
  per_page?: number
  total?: number
  data?: EnrollmentPlan[]
}

interface EmploymentData {
  id?: number
  major_name?: string
  province?: string
  year?: number
  graduates_count?: number
  employment_rate?: number
  average_salary?: number
  highest_salary?: number
  lowest_salary?: number
  industry?: string
  job_title?: string
  further_study_rate?: number
  major_code?: string
  employment_province?: string
}

interface EmploymentResponse {
  page?: number
  per_page?: number
  total?: number
  data?: EmploymentData[]
}

// ---------- 工具 ----------

function useChart(
  ref: React.RefObject<HTMLDivElement | null>,
  getOption: () => echarts.EChartsOption,
  deps: React.DependencyList,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    let chart: echarts.ECharts | null = null
    let ro: ResizeObserver | null = null
    let disposed = false
    let checkTimer: number | null = null

    // Tabs 懒加载：ref 可能在 DOM 渲染后才可用，轮询等待
    const tryInit = () => {
      if (disposed) return
      if (!ref.current) {
        checkTimer = window.setTimeout(tryInit, 50)
        return
      }

      chart = echarts.init(ref.current)
      chart.setOption(getOption())
      chart.resize()

      ro = new ResizeObserver(() => chart?.resize())
      ro.observe(ref.current)
    }

    tryInit()

    return () => {
      disposed = true
      if (checkTimer) window.clearTimeout(checkTimer)
      if (ro) ro.disconnect()
      if (chart) chart.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, ...deps])
}

function groupSum<T>(
  items: T[],
  keyFn: (item: T) => string,
  valFn: (item: T) => number
) {
  const map = new Map<string, number>()
  for (const item of items) {
    const k = keyFn(item)
    map.set(k, (map.get(k) || 0) + valFn(item))
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

// ---------- 组件 ----------

export default function AnalysisPage() {
  const [enrollmentRaw, setEnrollmentRaw] = useState<EnrollmentResponse | null>(null)
  const [employmentRaw, setEmploymentRaw] = useState<EmploymentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('enrollment')

  const plans = enrollmentRaw?.data || []
  const employments = employmentRaw?.data || []

  // ====== 招生计划聚合 ======

  const schoolBar = useMemo(() => {
    const byPlan = groupSum(plans, (p) => p.school_name || '其他', (p) => p.plan_count || 0)
    const top = byPlan.slice(0, 10)
    const byActual = new Map(
      groupSum(plans, (p) => p.school_name || '其他', (p) => p.actual_count || 0).map((x) => [x.name, x.value])
    )
    return {
      schools: top.map((x) => x.name),
      plan: top.map((x) => x.value),
      actual: top.map((x) => byActual.get(x.name) || 0),
    }
  }, [plans])

  const batchPie = useMemo(
    () => groupSum(plans, (p) => p.batch || '其他', (p) => p.plan_count || 0),
    [plans]
  )

  const majorTrend = useMemo(() => {
    const byMajor = groupSum(plans, (p) => p.major_name || '其他', (p) => p.plan_count || 0)
    const topMajors = byMajor.slice(0, 5).map((x) => x.name)
    const allYears = Array.from(new Set(plans.map((p) => String(p.year || '')).filter(Boolean))).sort()

    const series = topMajors.map((major) => {
      const majorPlans = plans.filter((p) => (p.major_name || '其他') === major)
      const byYear = new Map(
        groupSum(majorPlans, (p) => String(p.year || ''), (p) => p.plan_count || 0).map((x) => [x.name, x.value])
      )
      return { name: major, data: allYears.map((y) => byYear.get(y) || 0) }
    })

    return { years: allYears, series }
  }, [plans])

  // ====== 就业数据聚合 ======

  // 按专业聚合：取最新的就业率
  const empByMajor = useMemo(() => {
    const map = new Map<string, EmploymentData>()
    for (const e of employments) {
      const name = e.major_name || '其他'
      const existing = map.get(name)
      if (!existing || (e.year || 0) > (existing.year || 0)) {
        map.set(name, e)
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.employment_rate || 0) - (a.employment_rate || 0))
  }, [employments])

  const empBar = useMemo(() => {
    return {
      majors: empByMajor.map((e) => e.major_name || '其他'),
      rates: empByMajor.map((e) => {
        const rate = e.employment_rate || 0
        return rate < 1 ? +(rate * 100).toFixed(2) : +rate.toFixed(2)
      }),
    }
  }, [empByMajor])

  const empScatter = useMemo(() => {
    return empByMajor
      .filter((e) => e.major_name && e.employment_rate != null)
      .map((e) => ({
        name: e.major_name || '其他',
        // 后端可能以小数(0.95)或百分比(95)存储，统一转为百分比
        value: [
          (e.employment_rate || 0) < 1 ? +((e.employment_rate || 0) * 100).toFixed(2) : +(e.employment_rate || 0).toFixed(2),
          +(e.average_salary || 0).toFixed(0),
        ],
      }))
  }, [empByMajor])

  const empRadar = useMemo(() => {
    // 取 Top 3 专业做雷达图对比
    return empByMajor.slice(0, 3).map((e) => {
      const rate = e.employment_rate || 0
      const ratePct = rate < 1 ? rate * 100 : rate
      return {
        name: e.major_name || '其他',
        data: [
          +ratePct.toFixed(2),
          +(e.average_salary || 0).toFixed(0),
          +((1 - (e.further_study_rate || 0)) * 100).toFixed(2), // 就业而非深造比例，近似对口率
          +(e.further_study_rate || 0) * 100 + 50, // 满意度（mock 基于深造率推导）
          +((e.average_salary || 0) / 200).toFixed(2), // 薪资/200 作为晋升空间指标
        ],
      }
    })
  }, [empByMajor])

  // ====== DOM 引用 ======
  const barRef = useRef<HTMLDivElement>(null)
  const pieRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const empBarRef = useRef<HTMLDivElement>(null)
  const empScatterRef = useRef<HTMLDivElement>(null)
  const empRadarRef = useRef<HTMLDivElement>(null)

  // ====== 数据获取 ======
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        try {
          const res = await api.get('/api/v1/analysis/enrollment-plans')
          setEnrollmentRaw(res.data.data || res.data)
        } catch (err) {
          console.error('获取招生计划数据失败:', err)
          setEnrollmentRaw(null)
        }

        try {
          const res = await api.get('/api/v1/analysis/employment-data')
          setEmploymentRaw(res.data.data || res.data)
        } catch (err) {
          console.error('获取就业数据失败:', err)
          setEmploymentRaw(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ====== 招生计划图表 ======

  const barOpt = useMemo<echarts.EChartsOption>(
    () => ({
      title: { text: '各学校招生计划对比（Top 10）', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['计划招生', '实际招生'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: schoolBar.schools, axisLabel: { rotate: 30, interval: 0 } },
      yAxis: { type: 'value', name: '招生人数' },
      series: [
        { name: '计划招生', type: 'bar', data: schoolBar.plan, itemStyle: { color: '#3b82f6' } },
        { name: '实际招生', type: 'bar', data: schoolBar.actual, itemStyle: { color: '#10b981' } },
      ],
    }),
    [schoolBar]
  )
  useChart(barRef, () => barOpt, [barOpt], plans.length > 0)

  const pieOpt = useMemo<echarts.EChartsOption>(
    () => ({
      title: { text: '招生计划批次分布', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '招生计划',
          type: 'pie',
          radius: '50%',
          data: batchPie,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
        },
      ],
    }),
    [batchPie]
  )
  useChart(pieRef, () => pieOpt, [pieOpt], plans.length > 0)

  const lineOpt = useMemo<echarts.EChartsOption>(
    () => ({
      title: { text: '热门专业招生趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: majorTrend.series.map((s) => s.name), bottom: 0 },
      xAxis: { type: 'category', data: majorTrend.years },
      yAxis: { type: 'value', name: '招生人数' },
      series: majorTrend.series.map((s, i) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: true,
        itemStyle: { color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] },
      })),
    }),
    [majorTrend]
  )
  useChart(lineRef, () => lineOpt, [lineOpt], plans.length > 0)

  // ====== 就业数据图表 ======

  const empBarOpt = useMemo<echarts.EChartsOption>(
    () => ({
      title: { text: '各专业就业率对比', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', name: '就业率(%)', max: 100 },
      yAxis: { type: 'category', data: empBar.majors },
      series: [
        {
          name: '就业率',
          type: 'bar',
          data: empBar.rates,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' },
            ]),
          },
          label: { show: true, position: 'right', formatter: '{c}%' },
        },
      ],
    }),
    [empBar]
  )
  useChart(empBarRef, () => empBarOpt, [empBarOpt, activeTab], activeTab === 'employment' && empBar.majors.length > 0)

  const empScatterOpt = useMemo<echarts.EChartsOption>(
    () => ({
      title: { text: '薪资与就业率关系', left: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: (params) => `${params.name}<br/>就业率: ${(params.value as number[])[0]}%<br/>平均薪资: ${(params.value as number[])[1]}元`,
      },
      xAxis: { type: 'value', name: '就业率(%)' },
      yAxis: { type: 'value', name: '平均薪资(元)' },
      series: [
        {
          name: '专业就业情况',
          type: 'scatter',
          data: empScatter,
          symbolSize: 15,
          itemStyle: {
            color: (params) => ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][params.dataIndex % 6],
          },
        },
      ],
    }),
    [empScatter]
  )
  useChart(empScatterRef, () => empScatterOpt, [empScatterOpt, activeTab], activeTab === 'employment' && empScatter.length > 0)

  const empRadarOpt = useMemo<echarts.EChartsOption>(
    () => {
      const series = empRadar.map((item, i) => ({
        name: item.name,
        type: 'radar' as const,
        data: [{ value: item.data, name: item.name }],
        itemStyle: { color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] },
      }))

      return {
        title: { text: '就业质量评估', left: 'center' },
        tooltip: {},
        legend: { data: empRadar.map((r) => r.name), bottom: 0 },
        radar: {
          indicator: [
            { name: '就业率', max: 100 },
            { name: '平均薪资', max: 20000 },
            { name: '就业占比', max: 100 },
            { name: '满意度', max: 100 },
            { name: '薪资水平', max: 100 },
          ],
        },
        series,
      }
    },
    [empRadar]
  )
  useChart(empRadarRef, () => empRadarOpt, [empRadarOpt, activeTab], activeTab === 'employment' && empRadar.length > 0)

  return (
    <div style={{ padding: '24px' }}>
      <h2>数据分析</h2>

      <Spin spinning={loading} description="加载数据中...">
        <Tabs defaultActiveKey="enrollment" onChange={(key) => { console.log('activeTab:', key); setActiveTab(key) }} style={{ marginTop: 24 }}
          items={[
            {
              key: 'enrollment',
              label: '招生计划分析',
              children: (
                <>
                  <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={12}>
                      <Card title="各学校招生计划对比（Top 10）">
                        <div ref={barRef} style={{ width: '100%', height: '400px' }} />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="招生计划批次分布">
                        <div ref={pieRef} style={{ width: '100%', height: '400px' }} />
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24}>
                      <Card title="热门专业招生趋势">
                        <div ref={lineRef} style={{ width: '100%', height: '400px' }} />
                      </Card>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'employment',
              label: '就业数据分析',
              children: (
                <>
                  <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24} lg={12}>
                      <Card title="各专业就业率对比">
                        <div ref={empBarRef} style={{ width: '100%', height: '400px' }} />
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="薪资与就业率关系">
                        <div ref={empScatterRef} style={{ width: '100%', height: '400px' }} />
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                    <Col xs={24}>
                      <Card title="就业质量评估">
                        <div ref={empRadarRef} style={{ width: '100%', height: '400px' }} />
                      </Card>
                    </Col>
                  </Row>
                </>
              ),
            },
          ]}
        />
      </Spin>
    </div>
  )
}
