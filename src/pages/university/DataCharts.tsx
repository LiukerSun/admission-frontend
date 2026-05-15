import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, Empty, Spin, Tabs } from 'antd'
import {
  LineChartOutlined,
  TeamOutlined,
  BarChartOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import * as echarts from 'echarts'
import { admissionApi, type AdmissionLine, type TrendYear } from '@/services/admission'
import type {
  TrendResponse,
  GroupComparisonResponse,
  MajorDistributionResponse,
  MajorComparisonResponse,
} from '@/services/admission'

interface DataChartsProps {
  universityId: number
  selectedGroupCode: string | null
  selectedMajor: AdmissionLine | null
  loading: boolean
}

const tabItems = [
  { key: 'trend', label: '录取趋势', icon: <LineChartOutlined /> },
  { key: 'groups', label: '招生计划', icon: <TeamOutlined /> },
  { key: 'distribution', label: '分数分布', icon: <BarChartOutlined /> },
  { key: 'comparison', label: '性价比', icon: <TrophyOutlined /> },
]

export default function DataCharts({ universityId, selectedGroupCode, selectedMajor, loading }: DataChartsProps) {
  const [activeTab, setActiveTab] = useState('trend')
  const [trendData, setTrendData] = useState<TrendResponse | null>(null)
  const [groupsData, setGroupsData] = useState<GroupComparisonResponse | null>(null)
  const [distributionData, setDistributionData] = useState<MajorDistributionResponse | null>(null)
  const [comparisonData, setComparisonData] = useState<MajorComparisonResponse | null>(null)
  const [tabLoading, setTabLoading] = useState(false)

  const trendChartRef = useRef<HTMLDivElement>(null)
  const groupsChartRef = useRef<HTMLDivElement>(null)
  const distributionChartRef = useRef<HTMLDivElement>(null)
  const comparisonChartRef = useRef<HTMLDivElement>(null)
  const chartInstances = useRef<Record<string, { chart: echarts.ECharts | null; el: HTMLElement | null }>>({
    trend: { chart: null, el: null },
    groups: { chart: null, el: null },
    distribution: { chart: null, el: null },
    comparison: { chart: null, el: null },
  })
  const observersRef = useRef<Record<string, ResizeObserver | null>>({
    trend: null,
    groups: null,
    distribution: null,
    comparison: null,
  })

  const getOrCreateChart = useCallback((key: string, el: HTMLDivElement | null) => {
    if (!el) return null
    const instance = chartInstances.current[key]
    if (instance.chart && instance.el === el) {
      return instance.chart
    }
    if (instance.chart) {
      instance.chart.dispose()
    }
    if (observersRef.current[key]) {
      observersRef.current[key]?.disconnect()
      observersRef.current[key] = null
    }
    const chart = echarts.init(el)
    const observer = new ResizeObserver(() => {
      chart.resize()
    })
    observer.observe(el)
    observersRef.current[key] = observer
    chartInstances.current[key] = { chart, el }
    return chart
  }, [])

  // Load trend data
  useEffect(() => {
    if (!universityId) return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setTabLoading(true)
    })
    admissionApi
      .getTrend(universityId, {
        group_code: selectedGroupCode || undefined,
        local_major_code: selectedMajor?.local_major_code || undefined,
        years: 5,
      })
      .then((res) => {
        if (!cancelled) setTrendData(res.data.data || null)
      })
      .catch(() => {
        if (!cancelled) setTrendData(null)
      })
      .finally(() => {
        if (!cancelled) setTabLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [universityId, selectedGroupCode, selectedMajor])

  // Load groups data
  useEffect(() => {
    if (!universityId) return
    let cancelled = false
    admissionApi
      .getGroupComparison(universityId)
      .then((res) => {
        if (!cancelled) setGroupsData(res.data.data || null)
      })
      .catch(() => {
        if (!cancelled) setGroupsData(null)
      })
    return () => {
      cancelled = true
    }
  }, [universityId])

  // Load distribution data
  useEffect(() => {
    if (!universityId || !selectedGroupCode) {
      queueMicrotask(() => setDistributionData(null))
      return
    }
    let cancelled = false
    admissionApi
      .getMajorDistribution(universityId, { group_code: selectedGroupCode })
      .then((res) => {
        if (!cancelled) setDistributionData(res.data.data || null)
      })
      .catch(() => {
        if (!cancelled) setDistributionData(null)
      })
    return () => {
      cancelled = true
    }
  }, [universityId, selectedGroupCode])

  // Load comparison data
  useEffect(() => {
    if (!selectedMajor?.local_major_name) {
      queueMicrotask(() => setComparisonData(null))
      return
    }
    let cancelled = false
    admissionApi
      .getMajorComparison({ local_major_name: selectedMajor.local_major_name, limit: 50 })
      .then((res) => {
        if (!cancelled) setComparisonData(res.data.data || null)
      })
      .catch(() => {
        if (!cancelled) setComparisonData(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedMajor])

  // Render trend chart
  useEffect(() => {
    const chart = getOrCreateChart('trend', trendChartRef.current)
    if (!chart || !trendData?.years?.length) {
      chart?.clear()
      return
    }

    const years = trendData.years.map((y) => String(y.year))
    const planData = trendData.years.map((y) => y.admitted_count ?? null)
    const scoreData = trendData.years.map((y) => y.min_score ?? y.group_min_score ?? null)
    const rankData = trendData.years.map((y) => y.min_rank ?? y.group_min_rank ?? null)

    const hasPlan = planData.some((v) => v !== null)
    const hasScore = scoreData.some((v) => v !== null)
    const hasRank = rankData.some((v) => v !== null)

    const yAxis: echarts.YAXisComponentOption[] = []
    const series: echarts.SeriesOption[] = []
    let yIdx = 0

    if (hasPlan) {
      yAxis.push({ type: 'value', name: '招生人数', position: 'left', splitLine: { lineStyle: { type: 'dashed' } } })
      series.push({
        name: '招生人数',
        type: 'bar',
        yAxisIndex: yIdx++,
        data: planData,
        itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 32,
      } as echarts.SeriesOption)
    }
    if (hasScore) {
      yAxis.push({ type: 'value', name: '分数线', position: 'right', splitLine: { show: false } })
      series.push({
        name: '分数线',
        type: 'line',
        yAxisIndex: yIdx++,
        data: scoreData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#16A34A' },
        lineStyle: { width: 3 },
      } as echarts.SeriesOption)
    }
    if (hasRank) {
      yAxis.push({ type: 'value', name: '位次', position: 'right', inverse: true, offset: hasScore ? 40 : 0, splitLine: { show: false } })
      series.push({
        name: '位次',
        type: 'line',
        yAxisIndex: yIdx++,
        data: rankData,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        itemStyle: { color: '#DC2626' },
        lineStyle: { width: 3 },
      } as echarts.SeriesOption)
    }

    const title = selectedMajor
      ? `${selectedMajor.local_major_name} 历年趋势`
      : selectedGroupCode
        ? `${selectedGroupCode} 专业组历年趋势`
        : '全校历年录取趋势'

    chart.setOption(
      {
        title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0 },
        grid: { left: '2%', right: '4%', bottom: '14%', top: '14%', containLabel: true },
        xAxis: { type: 'category', data: years, axisLabel: { fontSize: 12 } },
        yAxis,
        series,
      },
      true
    )
  }, [trendData, selectedMajor, selectedGroupCode, getOrCreateChart, loading, activeTab])

  // Render groups chart
  useEffect(() => {
    const chart = getOrCreateChart('groups', groupsChartRef.current)
    if (!chart || !groupsData?.groups?.length) {
      chart?.clear()
      return
    }

    const groups = groupsData.groups
    const names = groups.map((g) => g.group_code)
    const planData = groups.map((g) => g.admitted_count)
    const scoreData = groups.map((g) => g.group_min_score ?? null)
    const rankData = groups.map((g) => g.group_min_rank ?? null)

    chart.setOption(
      {
        title: { text: `${groupsData.admission_year}年 专业组对比`, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { bottom: 0 },
        grid: { left: '8%', right: '8%', bottom: '14%', top: '14%', containLabel: true },
        xAxis: { type: 'category', data: names, axisLabel: { rotate: 30, fontSize: 11 } },
        yAxis: [
          { type: 'value', name: '招生人数/分数', position: 'left', splitLine: { lineStyle: { type: 'dashed' } } },
          { type: 'value', name: '位次', position: 'right', inverse: true, splitLine: { show: false } },
        ],
        series: [
          { name: '招生人数', type: 'bar', data: planData, itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 24 },
          { name: '组最低分', type: 'line', yAxisIndex: 0, data: scoreData, smooth: true, symbol: 'circle', itemStyle: { color: '#16A34A' }, lineStyle: { width: 2 } },
          { name: '组最低位次', type: 'line', yAxisIndex: 1, data: rankData, smooth: true, symbol: 'diamond', itemStyle: { color: '#DC2626' }, lineStyle: { width: 2 } },
        ],
      },
      true
    )
  }, [groupsData, getOrCreateChart, loading, activeTab])

  // Render distribution chart
  useEffect(() => {
    const chart = getOrCreateChart('distribution', distributionChartRef.current)
    if (!chart || !distributionData?.majors?.length) {
      chart?.clear()
      return
    }

    const majors = distributionData.majors.slice(0, 15)
    const names = majors.map((m) => m.local_major_name)
    const scoreData = majors.map((m) => m.min_score ?? null)
    const rankData = majors.map((m) => m.min_rank ?? null)
    const planData = majors.map((m) => m.admitted_count ?? null)

    const highlightIndex = selectedMajor
      ? majors.findIndex((m) => m.local_major_code === selectedMajor.local_major_code)
      : -1

    chart.setOption(
      {
        title: { text: `${distributionData.group_code} 专业分数分布`, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { bottom: 0 },
        grid: { left: '8%', right: '8%', bottom: '14%', top: '14%', containLabel: true },
        xAxis: { type: 'category', data: names, axisLabel: { rotate: 30, fontSize: 10 } },
        yAxis: [
          { type: 'value', name: '分数/人数', position: 'left', splitLine: { lineStyle: { type: 'dashed' } } },
          { type: 'value', name: '位次', position: 'right', inverse: true, splitLine: { show: false } },
        ],
        series: [
          {
            name: '招生人数',
            type: 'bar',
            data: planData.map((v, i) => ({
              value: v,
              itemStyle: i === highlightIndex ? { color: '#D97706' } : { color: '#3B82F6' },
            })),
            barMaxWidth: 20,
          },
          { name: '最低分', type: 'line', yAxisIndex: 0, data: scoreData, smooth: true, symbol: 'circle', itemStyle: { color: '#16A34A' }, lineStyle: { width: 2 } },
          { name: '最低位次', type: 'line', yAxisIndex: 1, data: rankData, smooth: true, symbol: 'diamond', itemStyle: { color: '#DC2626' }, lineStyle: { width: 2 } },
        ],
      },
      true
    )
  }, [distributionData, selectedMajor, getOrCreateChart, loading, activeTab])

  // Render comparison chart
  useEffect(() => {
    const chart = getOrCreateChart('comparison', comparisonChartRef.current)
    if (!chart || !comparisonData?.items?.length) {
      chart?.clear()
      return
    }

    const items = comparisonData.items
    const names = items.map((i) => i.university_name)
    const scoreData = items.map((i) => i.min_score ?? null)
    const rankData = items.map((i) => i.min_rank ?? null)
    const planData = items.map((i) => i.admitted_count ?? null)

    chart.setOption(
      {
        title: { text: `${comparisonData.local_major_name} 跨校对比`, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { bottom: 0 },
        grid: { left: '8%', right: '8%', bottom: '14%', top: '14%', containLabel: true },
        xAxis: { type: 'category', data: names, axisLabel: { rotate: 30, fontSize: 10 } },
        yAxis: [
          { type: 'value', name: '分数/人数', position: 'left', splitLine: { lineStyle: { type: 'dashed' } } },
          { type: 'value', name: '位次', position: 'right', inverse: true, splitLine: { show: false } },
        ],
        series: [
          { name: '招生人数', type: 'bar', data: planData, itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 20 },
          { name: '最低分', type: 'line', yAxisIndex: 0, data: scoreData, smooth: true, symbol: 'circle', itemStyle: { color: '#16A34A' }, lineStyle: { width: 2 } },
          { name: '最低位次', type: 'line', yAxisIndex: 1, data: rankData, smooth: true, symbol: 'diamond', itemStyle: { color: '#DC2626' }, lineStyle: { width: 2 } },
        ],
      },
      true
    )
  }, [comparisonData, getOrCreateChart, loading, activeTab])

  // Resize all charts
  useEffect(() => {
    const handleResize = () => {
      Object.values(chartInstances.current).forEach((instance) => instance.chart?.resize())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dispose charts on unmount
  useEffect(() => {
    const instances = chartInstances.current
    const observers = observersRef.current
    return () => {
      Object.values(instances).forEach((instance) => {
        instance.chart?.dispose()
      })
      Object.values(observers).forEach((o) => o?.disconnect())
    }
  }, [])

  const renderChartContent = (key: string) => {
    if (loading || tabLoading) {
      return (
        <Card size="small" style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </Card>
      )
    }

    if (key === 'distribution' && !selectedGroupCode) {
      return (
        <Card size="small" style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先选择专业组" />
        </Card>
      )
    }

    if (key === 'comparison' && !selectedMajor) {
      return (
        <Card size="small" style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先选择专业" />
        </Card>
      )
    }

    const dataMap: Record<string, unknown[]> = {
      trend: trendData?.years ?? [],
      groups: groupsData?.groups ?? [],
      distribution: distributionData?.majors ?? [],
      comparison: comparisonData?.items ?? [],
    }

    const data = dataMap[key]
    const hasData = data.length > 0

    const hasValidData = (() => {
      if (!hasData) return false
      if (key === 'trend') {
        return (data as TrendYear[]).some(
          (y) =>
            y.admitted_count != null ||
            y.min_score != null ||
            y.min_rank != null ||
            y.group_min_score != null ||
            y.group_min_rank != null
        )
      }
      if (key === 'groups') {
        return hasData
      }
      return true
    })()

    if (!hasValidData) {
      return (
        <Card size="small" style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无相关数据" />
        </Card>
      )
    }

    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      trend: trendChartRef,
      groups: groupsChartRef,
      distribution: distributionChartRef,
      comparison: comparisonChartRef,
    }

    return (
      <Card size="small" style={{ padding: 0, height: '100%' }} bodyStyle={{ padding: 8, height: '100%' }}>
        <div ref={refMap[key]} style={{ width: '100%', height: '100%' }} />
      </Card>
    )
  }

  return (
    <div className="data-charts-wrapper">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems.map((item) => ({
          key: item.key,
          label: (
            <span>
              {item.icon}
              <span style={{ marginLeft: 4 }}>{item.label}</span>
            </span>
          ),
          children: renderChartContent(item.key),
        }))}
      />
    </div>
  )
}
