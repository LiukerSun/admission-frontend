import { useEffect, useMemo, useRef } from 'react'
import { BarChartOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'
import './analysis.css'

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
    const x = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
    const y = [8.2, 8.9, 9.4, 10.1, 10.9, 11.8, 12.6, 13.9, 14.8, 15.6]
    return {
      grid: { left: 18, right: 18, top: 22, bottom: 18, containLabel: true },
      xAxis: {
        type: 'category',
        data: x,
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
          data: y,
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
    const data = [
      { name: '互联网/IT', value: 35 },
      { name: '金融', value: 20 },
      { name: '教育', value: 15 },
      { name: '医疗', value: 12 },
      { name: '制造', value: 10 },
      { name: '其他', value: 8 },
    ]
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['56%', '78%'],
          center: ['36%', '46%'],
          data,
          label: { show: false },
          emphasis: { scale: false },
          itemStyle: { borderWidth: 0 },
        },
      ],
      color: ['#1E40AF', '#16A34A', '#DC2626', '#7C3AED', '#F59E0B', '#64748B'],
    }
  }, [])

  const radarOption = useMemo<echarts.EChartsOption>(() => {
    return {
      radar: {
        radius: '68%',
        indicator: [
          { name: '就业', max: 100 },
          { name: '薪资', max: 100 },
          { name: '热度', max: 100 },
          { name: '难度', max: 100 },
          { name: '学习', max: 100 },
        ],
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
              value: [84, 89, 74, 79, 70],
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
    const pts = [
      ['北京', 65, 10500],
      ['上海', 72, 11200],
      ['深圳', 80, 12500],
      ['杭州', 78, 11800],
      ['成都', 74, 11000],
      ['南京', 76, 11500],
      ['武汉', 70, 10900],
    ]
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
          data: pts,
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
    <div className="dataCenterRoot">
      <div className="dataCenterBoard">
        <div className="dataCenterInner">
          <div className="dcGlass dcHeader">
            <div className="dcHeaderTitle">
              <BarChartOutlined />
              数据分析中心
            </div>
            <div className="dcHeaderSub">基于大数据指标辅助你进行专业与就业洞察</div>
            <div className="dcStats">
              <div className="dcStatItem">
                <div className="dcStatLabel">院校覆盖</div>
                <div className="dcStatValue">2000+</div>
              </div>
              <div className="dcStatItem">
                <div className="dcStatLabel">专业类别</div>
                <div className="dcStatValue">300+</div>
              </div>
              <div className="dcStatItem">
                <div className="dcStatLabel">样本数量</div>
                <div className="dcStatValue">3万+</div>
              </div>
              <div className="dcStatItem">
                <div className="dcStatLabel">数据更新</div>
                <div className="dcStatValue">实时</div>
              </div>
            </div>
          </div>

          <div className="dcGlass dcSection">
            <div className="dcSectionTitleRow">
              <div>
                <div className="dcSectionTitle">专业薪资增长曲线</div>
                <div className="dcSectionSub">按近年趋势（单位：万元/月）</div>
              </div>
              <div className="dcSectionSub">收入预期</div>
            </div>
            <div className="dcChartBox dcChartLarge" ref={lineRef} />
          </div>

          <div className="dcGlass dcSection">
            <div className="dcMiniTitle">（各十年内专业增长百分比）</div>
            <div className="dcMiniRow">
              <div className="dcMiniCard" />
              <div className="dcMiniCard" />
              <div className="dcMiniCard" />
              <div className="dcMiniCard" />
            </div>
          </div>

          <div className="dcTwoCol">
            <div className="dcGlass dcCardPad">
              <div className="dcSectionTitleRow">
                <div className="dcSectionTitle">行业就业分布</div>
                <div className="dcSectionSub">占比</div>
              </div>
              <div className="dcChartBox dcChartMid" ref={donutRef} />
            </div>

            <div className="dcGlass dcCardPad">
              <div className="dcSectionTitleRow">
                <div className="dcSectionTitle">专业综合对比雷达图</div>
                <div className="dcSectionSub">多维度评估</div>
              </div>
              <div className="dcRadarWrap">
                <div className="dcChartBox" ref={radarRef} />
                <div className="dcMetricGrid">
                  <div className="dcMetric">
                    <div className="dcMetricValue">84.0</div>
                    <div className="dcMetricLabel">就业指数</div>
                  </div>
                  <div className="dcMetric">
                    <div className="dcMetricValue">89.3</div>
                    <div className="dcMetricLabel">薪资指数</div>
                  </div>
                  <div className="dcMetric">
                    <div className="dcMetricValue">73.7</div>
                    <div className="dcMetricLabel">热度指数</div>
                  </div>
                  <div className="dcMetric">
                    <div className="dcMetricValue">78.8</div>
                    <div className="dcMetricLabel">综合评分</div>
                  </div>
                  <div className="dcMetric">
                    <div className="dcMetricValue">78.6</div>
                    <div className="dcMetricLabel">学习难度</div>
                  </div>
                  <div className="dcMetric">
                    <div className="dcMetricValue">69.7</div>
                    <div className="dcMetricLabel">发展前景</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dcGlass dcSection">
            <div className="dcSectionTitleRow">
              <div className="dcSectionTitle">城市就业机会分析</div>
              <div className="dcSectionSub">机会指数 vs 平均薪资</div>
            </div>
            <div className="dcChartBox dcScatter" ref={scatterRef} />
            <div className="dcCityRow">
              <div className="dcCityCard">
                <div className="dcCityName">北京</div>
                <div className="dcCityMeta">¥16.5k · 机会指数 95</div>
              </div>
              <div className="dcCityCard">
                <div className="dcCityName">上海</div>
                <div className="dcCityMeta">¥15.8k · 机会指数 93</div>
              </div>
              <div className="dcCityCard">
                <div className="dcCityName">深圳</div>
                <div className="dcCityMeta">¥16.2k · 机会指数 90</div>
              </div>
              <div className="dcCityCard">
                <div className="dcCityName">杭州</div>
                <div className="dcCityMeta">¥14.5k · 机会指数 85</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
