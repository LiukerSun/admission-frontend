import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Card, Empty, Spin, Tabs } from 'antd'
import {
  LineChartOutlined,
  TeamOutlined,
  BarChartOutlined,
  // TrophyOutlined, // 性价比 tab 隐藏后暂未使用
} from '@ant-design/icons'
import * as echarts from 'echarts'
import { admissionApi, type AdmissionLine } from '@/services/admission'
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

type TabKey = 'trend' | 'groups' | 'distribution' | 'comparison'

const TAB_KEYS: TabKey[] = ['trend', 'groups', 'distribution', 'comparison']

type TabItem = { key: TabKey; label: string; icon: React.ReactNode }

export default function DataCharts({ universityId, selectedGroupCode, selectedMajor, loading }: DataChartsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('trend')

  const tabItems = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [
      { key: 'trend', label: '录取趋势', icon: <LineChartOutlined /> },
      { key: 'groups', label: '招生计划', icon: <TeamOutlined /> },
    ]
    if (selectedGroupCode) {
      items.push({ key: 'distribution', label: '分数分布', icon: <BarChartOutlined /> })
    }
    // 性价比 暂时隐藏 - 实现待重新设计
    // items.push({ key: 'comparison', label: '性价比', icon: <TrophyOutlined /> })
    return items
  }, [selectedGroupCode])

  // 当用户清空专业组时，distribution tab 已被 tabItems 过滤掉；
  // 在渲染期同步内部 activeTab，避免选中态指向不存在的 tab。
  if (!selectedGroupCode && activeTab === 'distribution') {
    setActiveTab('trend')
  }

  const [trendData, setTrendData] = useState<TrendResponse | null>(null)
  const [groupsData, setGroupsData] = useState<GroupComparisonResponse | null>(null)
  const [distributionData, setDistributionData] = useState<MajorDistributionResponse | null>(null)
  const [comparisonData, setComparisonData] = useState<MajorComparisonResponse | null>(null)
  const [loadingTabs, setLoadingTabs] = useState<Record<TabKey, boolean>>({
    trend: false,
    groups: false,
    distribution: false,
    comparison: false,
  })

  const setTabLoading = useCallback((key: TabKey, value: boolean) => {
    setLoadingTabs((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])

  const trendChartRef = useRef<HTMLDivElement>(null)
  const groupsChartRef = useRef<HTMLDivElement>(null)
  const distributionChartRef = useRef<HTMLDivElement>(null)
  const comparisonChartRef = useRef<HTMLDivElement>(null)
  const refMap: Record<TabKey, React.RefObject<HTMLDivElement | null>> = {
    trend: trendChartRef,
    groups: groupsChartRef,
    distribution: distributionChartRef,
    comparison: comparisonChartRef,
  }

  const chartInstances = useRef<Record<TabKey, { chart: echarts.ECharts | null; el: HTMLElement | null }>>({
    trend: { chart: null, el: null },
    groups: { chart: null, el: null },
    distribution: { chart: null, el: null },
    comparison: { chart: null, el: null },
  })
  const observersRef = useRef<Record<TabKey, ResizeObserver | null>>({
    trend: null,
    groups: null,
    distribution: null,
    comparison: null,
  })

  // Returns a chart instance, or null when the element has no measurable size yet.
  // ECharts silently breaks when init'd on a 0x0 element, so we defer until layout settles.
  const getOrCreateChart = useCallback((key: TabKey, el: HTMLDivElement | null): echarts.ECharts | null => {
    if (!el) return null
    const instance = chartInstances.current[key]
    if (instance.chart && !instance.chart.isDisposed() && instance.el === el) {
      return instance.chart
    }
    if (instance.chart && !instance.chart.isDisposed()) {
      instance.chart.dispose()
    }
    if (observersRef.current[key]) {
      observersRef.current[key]?.disconnect()
      observersRef.current[key] = null
    }
    if (!el.clientWidth || !el.clientHeight) {
      chartInstances.current[key] = { chart: null, el: null }
      return null
    }
    const chart = echarts.init(el)
    const observer = new ResizeObserver(() => {
      if (!chart.isDisposed()) chart.resize()
    })
    observer.observe(el)
    observersRef.current[key] = observer
    chartInstances.current[key] = { chart, el }
    return chart
  }, [])

  // Schedules a chart render that retries via rAF until the target element has measurable size.
  // Returns a cleanup function for use inside useEffect.
  const scheduleChartRender = useCallback(
    (
      key: TabKey,
      ref: React.RefObject<HTMLDivElement | null>,
      buildOption: () => echarts.EChartsOption | null,
    ) => {
      let rafId: number | null = null
      let cancelled = false

      const tryRender = () => {
        if (cancelled) return
        const node = ref.current
        if (!node) {
          rafId = requestAnimationFrame(tryRender)
          return
        }
        if (!node.clientWidth || !node.clientHeight) {
          rafId = requestAnimationFrame(tryRender)
          return
        }
        const chart = getOrCreateChart(key, node)
        if (!chart) {
          rafId = requestAnimationFrame(tryRender)
          return
        }
        const option = buildOption()
        if (option) {
          chart.setOption(option, true)
        } else {
          chart.clear()
        }
      }

      tryRender()

      return () => {
        cancelled = true
        if (rafId !== null) cancelAnimationFrame(rafId)
      }
    },
    [getOrCreateChart],
  )

  // ---- Data loading ----

  useEffect(() => {
    if (!universityId) return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setTabLoading('trend', true)
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
        if (!cancelled) setTabLoading('trend', false)
      })
    return () => {
      cancelled = true
    }
  }, [universityId, selectedGroupCode, selectedMajor, setTabLoading])

  useEffect(() => {
    if (!universityId) return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setTabLoading('groups', true)
    })
    admissionApi
      .getGroupComparison(universityId)
      .then((res) => {
        if (!cancelled) setGroupsData(res.data.data || null)
      })
      .catch(() => {
        if (!cancelled) setGroupsData(null)
      })
      .finally(() => {
        if (!cancelled) setTabLoading('groups', false)
      })
    return () => {
      cancelled = true
    }
  }, [universityId, setTabLoading])

  useEffect(() => {
    let cancelled = false
    if (!universityId || !selectedGroupCode) {
      queueMicrotask(() => {
        if (cancelled) return
        setDistributionData(null)
        setTabLoading('distribution', false)
      })
      return () => {
        cancelled = true
      }
    }
    queueMicrotask(() => {
      if (!cancelled) setTabLoading('distribution', true)
    })
    admissionApi
      .getMajorDistribution(universityId, { group_code: selectedGroupCode })
      .then((res) => {
        if (!cancelled) setDistributionData(res.data.data || null)
      })
      .catch(() => {
        if (!cancelled) setDistributionData(null)
      })
      .finally(() => {
        if (!cancelled) setTabLoading('distribution', false)
      })
    return () => {
      cancelled = true
    }
  }, [universityId, selectedGroupCode, setTabLoading])

  useEffect(() => {
    let cancelled = false
    if (!selectedMajor?.local_major_name) {
      queueMicrotask(() => {
        if (cancelled) return
        setComparisonData(null)
        setTabLoading('comparison', false)
      })
      return () => {
        cancelled = true
      }
    }
    queueMicrotask(() => {
      if (!cancelled) setTabLoading('comparison', true)
    })
    admissionApi
      .getMajorComparison({ local_major_name: selectedMajor.local_major_name, limit: 50 })
      .then((res) => {
        if (!cancelled) setComparisonData(res.data.data || null)
      })
      .catch(() => {
        if (!cancelled) setComparisonData(null)
      })
      .finally(() => {
        if (!cancelled) setTabLoading('comparison', false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedMajor, setTabLoading])

  // ---- Chart renderers ----

  // 录取趋势: bar (招生人数) + line (分数线) + line (位次)
  useEffect(() => {
    return scheduleChartRender('trend', trendChartRef, () => {
    if (!trendData?.years?.length) return null

    const years = trendData.years.map((y) => String(y.year))
    const planData = trendData.years.map((y) => y.admitted_count ?? null)
    const scoreData = trendData.years.map((y) => y.min_score ?? y.group_min_score ?? null)
    const rankData = trendData.years.map((y) => y.min_rank ?? y.group_min_rank ?? null)

    const hasPlan = planData.some((v) => v !== null)
    const hasScore = scoreData.some((v) => v !== null)
    const hasRank = rankData.some((v) => v !== null)
    if (!hasPlan && !hasScore && !hasRank) return null

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

    return {
      title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: '2%', right: '4%', bottom: '14%', top: '14%', containLabel: true },
      xAxis: { type: 'category', data: years, axisLabel: { fontSize: 12 } },
      yAxis,
      series,
    }
    })
     
  }, [trendData, selectedMajor, selectedGroupCode, activeTab, scheduleChartRender])

  // 招生计划: 仅 招生人数 柱状,按代码升序排列。其他指标移到 tooltip。
  useEffect(() => {
    return scheduleChartRender('groups', groupsChartRef, () => {
    if (!groupsData?.groups?.length) return null

    const sorted = [...groupsData.groups].sort((a, b) => a.group_code.localeCompare(b.group_code))
    const names = sorted.map((g) => g.group_code)
    const planData = sorted.map((g) => g.admitted_count)
    const totalPlan = planData.reduce((sum, v) => sum + (v || 0), 0)

    return {
      title: {
        text: `${groupsData.admission_year}年 各专业组招生计划`,
        subtext: `共 ${sorted.length} 个专业组,合计 ${totalPlan} 人`,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtextStyle: { fontSize: 11, color: '#6B7280' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as Array<{ dataIndex: number }>
          const idx = p[0]?.dataIndex ?? 0
          const g = sorted[idx]
          const scoreStr = g.group_min_score != null ? `<br/>组最低分: <b>${g.group_min_score}</b>` : ''
          const rankStr = g.group_min_rank != null ? `<br/>组最低位次: <b>${g.group_min_rank.toLocaleString()}</b>` : ''
          const majorsStr = g.group_major_names ? `<br/><span style="color:#6B7280">${g.group_major_names}</span>` : ''
          const subjectStr = g.subject_requirement_name ? `<br/>选科: ${g.subject_requirement_name}` : ''
          return `<b>专业组 ${g.group_code}</b>${majorsStr}<br/>招生人数: <b>${g.admitted_count}</b> 人<br/>专业数: ${g.major_count}${subjectStr}${scoreStr}${rankStr}`
        },
      },
      grid: { left: '4%', right: '4%', bottom: '12%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        name: '招生人数',
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          name: '招生人数',
          type: 'bar',
          data: planData,
          itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40,
          label: {
            show: sorted.length <= 20,
            position: 'top',
            fontSize: 11,
            color: '#374151',
            formatter: '{c}',
          },
        },
      ],
    }
    })
     
  }, [groupsData, activeTab, scheduleChartRender])

  // 分数分布: 当前专业组内各专业的 招生人数 + 最低分 + 最低位次
  useEffect(() => {
    return scheduleChartRender('distribution', distributionChartRef, () => {
    if (!distributionData?.majors?.length) return null

    const majors = distributionData.majors.slice(0, 15)
    const names = majors.map((m) => m.local_major_name)
    const scoreData = majors.map((m) => m.min_score ?? null)
    const rankData = majors.map((m) => m.min_rank ?? null)
    const planData = majors.map((m) => m.admitted_count ?? null)

    const highlightIndex = selectedMajor
      ? majors.findIndex((m) => m.local_major_code === selectedMajor.local_major_code)
      : -1

    return {
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
    }
    })
     
  }, [distributionData, selectedMajor, activeTab, scheduleChartRender])

  // 性价比: 跨院校对比
  useEffect(() => {
    return scheduleChartRender('comparison', comparisonChartRef, () => {
    if (!comparisonData?.items?.length) return null

    const items = comparisonData.items
    const validRanks = items.map((i) => i.min_rank ?? 0).filter((r) => r > 0)
    const validTuitions = items.map((i) => i.tuition ?? 0).filter((t) => t > 0)
    const minRank = validRanks.length ? Math.min(...validRanks) : 0
    const maxRank = validRanks.length ? Math.max(...validRanks) : 1
    const minTuition = validTuitions.length ? Math.min(...validTuitions) : 0
    const maxTuition = validTuitions.length ? Math.max(...validTuitions) : 1
    const rankRange = maxRank - minRank || 1
    const tuitionRange = maxTuition - minTuition || 1

    const scored = items.map((item) => {
      const rank = item.min_rank ?? 0
      const tuition = item.tuition ?? 0
      const difficultyScore = rank > 0 ? ((rank - minRank) / rankRange) * 50 : 0
      const costScore = tuition > 0 ? (1 - (tuition - minTuition) / tuitionRange) * 30 : 15
      const tierScore = (item.is_985 ? 2 : item.is_211 ? 1 : 0) / 2 * 20
      return { ...item, xjScore: Math.round(difficultyScore + costScore + tierScore) }
    })

    scored.sort((a, b) => {
      const aHasRank = (a.min_rank ?? 0) > 0
      const bHasRank = (b.min_rank ?? 0) > 0
      if (aHasRank && !bHasRank) return -1
      if (!aHasRank && bHasRank) return 1
      return b.xjScore - a.xjScore
    })

    const tierLabel = (item: typeof scored[0]) =>
      item.is_985 ? '985院校' : item.is_211 ? '211院校' : '普通院校'

    const barColor = (item: typeof scored[0]) => {
      if (item.university_id === universityId) return '#16A34A'
      return item.is_985 ? '#F59E0B' : item.is_211 ? '#3B82F6' : '#9CA3AF'
    }

    return {
      title: {
        text: `${comparisonData.local_major_name} 性价比`,
        subtext: '录取难度(50%) · 学费成本(30%) · 院校层次(20%)',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtextStyle: { fontSize: 11, color: '#6B7280' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as Array<{ dataIndex: number }>
          const idx = p[0]?.dataIndex ?? 0
          const item = scored[idx]
          const rankStr = item.min_rank ? `最低位次: ${item.min_rank.toLocaleString()}` : '位次: 暂无'
          const tuitionStr = item.tuition && item.tuition > 0 ? `学费: ¥${item.tuition.toLocaleString()}/年` : '学费: 暂无'
          return `<b>${item.university_name}</b><br/>院校层次: ${tierLabel(item)}<br/>${rankStr}<br/>${tuitionStr}<br/>性价比得分: <b>${item.xjScore}</b>`
        },
      },
      legend: {
        bottom: 0,
        data: ['当前院校', '985院校', '211院校', '普通院校'],
        selectedMode: false,
      },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '22%', containLabel: true },
      xAxis: {
        type: 'category',
        data: scored.map((i) => i.university_name),
        axisLabel: { rotate: 30, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '性价比得分',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          name: '性价比',
          type: 'bar',
          data: scored.map((item) => ({
            value: item.xjScore,
            itemStyle: { color: barColor(item), borderRadius: [4, 4, 0, 0] },
          })),
          barMaxWidth: 24,
          label: {
            show: scored.length <= 20,
            position: 'top',
            fontSize: 10,
            formatter: '{c}',
          },
        },
        // Dummy series only to populate legend entries with the correct colors.
        { name: '当前院校', type: 'bar', data: [], itemStyle: { color: '#16A34A' } },
        { name: '985院校', type: 'bar', data: [], itemStyle: { color: '#F59E0B' } },
        { name: '211院校', type: 'bar', data: [], itemStyle: { color: '#3B82F6' } },
        { name: '普通院校', type: 'bar', data: [], itemStyle: { color: '#9CA3AF' } },
      ],
    }
    })
     
  }, [comparisonData, universityId, activeTab, scheduleChartRender])

  // Force a resize when activeTab flips so a chart that was init'd while hidden picks up real dimensions.
  useEffect(() => {
    const instance = chartInstances.current[activeTab]
    if (instance?.chart && !instance.chart.isDisposed()) {
      // Defer to next frame so the pane has finished its display transition.
      const raf = requestAnimationFrame(() => {
        if (!instance.chart!.isDisposed()) instance.chart!.resize()
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [activeTab])

  useEffect(() => {
    const handleResize = () => {
      Object.values(chartInstances.current).forEach((instance) => {
        if (instance.chart && !instance.chart.isDisposed()) instance.chart.resize()
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const instances = chartInstances.current
    const observers = observersRef.current
    return () => {
      TAB_KEYS.forEach((key) => {
        const instance = instances[key]
        if (instance.chart && !instance.chart.isDisposed()) {
          instance.chart.dispose()
        }
        instances[key] = { chart: null, el: null }
      })
      TAB_KEYS.forEach((key) => {
        observers[key]?.disconnect()
        observers[key] = null
      })
    }
  }, [])

  // ---- Render: chart div is always mounted, overlay sits on top for empty/loading states ----

  const hasValidData = (key: TabKey): boolean => {
    if (key === 'trend') {
      const years = trendData?.years ?? []
      return years.some(
        (y) =>
          y.admitted_count != null ||
          y.min_score != null ||
          y.min_rank != null ||
          y.group_min_score != null ||
          y.group_min_rank != null
      )
    }
    if (key === 'groups') return (groupsData?.groups?.length ?? 0) > 0
    if (key === 'distribution') return (distributionData?.majors?.length ?? 0) > 0
    if (key === 'comparison') return (comparisonData?.items?.length ?? 0) > 0
    return false
  }

  const renderChartContent = (key: TabKey) => {
    const isTabLoading = loading || loadingTabs[key]

    let overlay: React.ReactNode = null
    if (isTabLoading) {
      overlay = <Spin />
    } else if (key === 'comparison' && !selectedMajor) {
      overlay = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先选择专业" />
    } else if (!hasValidData(key)) {
      overlay = (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={key === 'trend' ? '该校未公开历年录取数据' : '暂无相关数据'}
        />
      )
    }

    return (
      <Card
        size="small"
        style={{ padding: 0, height: '100%' }}
        styles={{ body: { padding: 8, height: '100%', position: 'relative' } }}
      >
        <div ref={refMap[key]} style={{ width: '100%', height: '100%' }} />
        {overlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.75)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            {overlay}
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="data-charts-wrapper">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
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

