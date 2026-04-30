import { InfoCircleOutlined } from '@ant-design/icons'
import { PageHeader, SmartEmptyState } from '@/components/ui'

export default function AnalysisPage() {
  return (
    <div>
      <PageHeader
        eyebrow="数据中心"
        title="数据分析"
        description="当前分析界面等待新的图表方案和展示内容确认，确认后再接入院校趋势、薪资对比和志愿漏斗。"
      />
      <SmartEmptyState
        icon={<InfoCircleOutlined />}
        title="数据分析模块暂未开放"
        description="这里先保留为诚实空状态，避免用虚构指标误导报考判断。"
      />
    </div>
  )
}
