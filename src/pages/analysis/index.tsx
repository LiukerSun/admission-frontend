import { useEffect, useMemo, useRef } from 'react'
import { BarChartOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'
import { ChartCard, GlassPanel, PageBoard, StatBlock } from '@/components/ui'
import {
  CITY_CARDS,
  DONUT_COLORS,
  DONUT_DATA,
  HEADER_STATS,
  LINE_VALUES,
  LINE_YEARS,
  RADAR_INDICATORS,
  RADAR_METRICS,
  RADAR_VALUES,
  SCATTER_POINTS,
} from '@/fixtures/analysis'
import styles from './analysis.module.css'

function useEChart(option: echarts.EChartsOption) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption(option, { notMerge: true })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [option])

  return ref
}
 
export default function AnalysisPage() {
  const lineOption = useMemo<echarts.EChartsOption>(() => {
    return {
      grid: { left: 18, right: 18, top: 22, bottom: 18, containLabel: true },
      xAxis: {
        type: 'category',
        data: LINE_YEARS,
        axisLine: { lineStyle: { color: 'rgba(0,0,0,0.18)' } },
        axisLabel: { color: 'rgba(0,0,0,0.55)' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
        axisLabel: { color: 'rgba(0,0,0,0.55)' },
      },
      series: [
        {
          type: 'line',
          data: LINE_VALUES,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 3, color: '#1E88E5' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(30, 136, 229, 0.28)' },
              { offset: 1, color: 'rgba(30, 136, 229, 0.02)' },
            ]),
          },
        },
      ],
      tooltip: { trigger: 'axis' },
    }
  }, [])

  const donutOption = useMemo<echarts.EChartsOption>(() => {
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['56%', '78%'],
          center: ['36%', '46%'],
          data: DONUT_DATA,
          label: { show: false },
          emphasis: { scale: false },
          itemStyle: { borderWidth: 0 },
        },
      ],
      color: DONUT_COLORS,
    }
  }, [])

  const radarOption = useMemo<echarts.EChartsOption>(() => {
    return {
      radar: {
        radius: '68%',
        indicator: RADAR_INDICATORS,
        axisName: { color: 'rgba(0,0,0,0.65)', fontSize: 12 },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.10)' } },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)'] } },
        axisLine: { lineStyle: { color: 'rgba(0,0,0,0.12)' } },
      },
      tooltip: {},
      series: [
        {
          type: 'radar',
          data: [
            {
              value: RADAR_VALUES,
              name: '计算机类',
              areaStyle: { color: 'rgba(30, 64, 175, 0.18)' },
              lineStyle: { color: '#1E40AF' },
              symbol: 'none',
            },
          ],
        },
      ],
    }
  }, [])

  const scatterOption = useMemo<echarts.EChartsOption>(() => {
    return {
      grid: { left: 18, right: 18, top: 26, bottom: 30, containLabel: true },
      xAxis: {
        type: 'value',
        min: 60,
        max: 100,
        axisLabel: { color: 'rgba(0,0,0,0.55)' },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
        name: '就业机会指数',
        nameTextStyle: { color: 'rgba(0,0,0,0.55)' },
      },
      yAxis: {
        type: 'value',
        min: 10000,
        max: 14000,
        axisLabel: { color: 'rgba(0,0,0,0.55)' },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
        name: '平均薪资',
        nameTextStyle: { color: 'rgba(0,0,0,0.55)' },
      },
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const data = (p as { data?: unknown[] })?.data
          const city = typeof data?.[0] === 'string' ? data[0] : '-'
          const chance = typeof data?.[1] === 'number' ? data[1] : '-'
          const salary = typeof data?.[2] === 'number' ? data[2] : '-'
          return `${city}<br/>机会：${chance}<br/>薪资：¥${salary}`
        },
      },
      series: [
        {
          type: 'scatter',
          data: SCATTER_POINTS,
          symbolSize: 14,
          itemStyle: {
            color: (params: unknown) => {
              const v = (params as { data?: unknown[] })?.data?.[1]
              const vv = typeof v === 'number' ? v : 0
              if (vv >= 82) return '#DC2626'
              if (vv >= 76) return '#F97316'
              if (vv >= 72) return '#16A34A'
              return '#0EA5E9'
            },
            opacity: 0.9,
          },
        },
      ],
    }
  }, [])

  const lineRef = useEChart(lineOption)
  const donutRef = useEChart(donutOption)
  const radarRef = useEChart(radarOption)
  const scatterRef = useEChart(scatterOption)

  return (
    <div className={styles.root}>
      <PageBoard>
        <div className={styles.inner}>
          <GlassPanel padding="md">
            <div className={styles.headerTitle}>
              <BarChartOutlined />
              数据分析中心
            </div>
            <div className={styles.headerSub}>基于大数据指标辅助你进行专业与就业洞察</div>
            <div className={styles.statsGrid}>
              {HEADER_STATS.map((s) => (
                <StatBlock key={s.label} label={s.label} value={s.value} align="center" />
              ))}
            </div>
          </GlassPanel>

          <ChartCard title="专业薪资增长曲线" subtitle="按近年趋势（单位：万元/月）" extra={<span className={styles.muted}>收入预期</span>}>
            <div className={styles.chartLarge} ref={lineRef} />
          </ChartCard>

          <GlassPanel padding="md">
            <div className={styles.muted}>（各十年内专业增长百分比）</div>
            <div className={styles.miniRow}>
              <div className={styles.miniCard} />
              <div className={styles.miniCard} />
              <div className={styles.miniCard} />
              <div className={styles.miniCard} />
            </div>
          </GlassPanel>

          <div className={styles.twoCol}>
            <ChartCard title="行业就业分布" subtitle="占比">
              <div className={styles.chartMid} ref={donutRef} />
            </ChartCard>

            <ChartCard
              title="专业综合对比雷达图"
              subtitle="多维度评估"
              footer={
                <div className={styles.metricGrid}>
                  {RADAR_METRICS.map((m) => (
                    <StatBlock key={m.label} label={m.label} value={m.value} align="left" />
                  ))}
                </div>
              }
            >
              <div className={styles.chartMid} ref={radarRef} />
            </ChartCard>
          </div>

          <ChartCard
            title="城市就业机会分析"
            subtitle="机会指数 vs 平均薪资"
            footer={
              <div className={styles.cityRow}>
                {CITY_CARDS.map((c) => (
                  <div key={c.name} className={styles.cityCard}>
                    <div className={styles.cityName}>{c.name}</div>
                    <div className={styles.cityMeta}>{c.meta}</div>
                  </div>
                ))}
              </div>
            }
          >
            <div className={styles.scatter} ref={scatterRef} />
          </ChartCard>
        </div>
      </PageBoard>
    </div>
  )
}
