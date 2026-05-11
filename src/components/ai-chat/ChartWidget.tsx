import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

type Props = {
  payload: Record<string, unknown>
}

export default function ChartWidget({ payload }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return

    chartRef.current = echarts.init(ref.current)
    chartRef.current.setOption(payload as EChartsOption, { notMerge: true })

    const ro = new ResizeObserver(() => chartRef.current?.resize())
    ro.observe(ref.current)

    return () => {
      ro.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [payload])

  return <div ref={ref} style={{ width: '100%', height: 320 }} />
}

