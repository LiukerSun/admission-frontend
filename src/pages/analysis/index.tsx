import { Card, Empty } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

export default function AnalysisPage() {
  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>数据分析</h2>
      <p style={{ color: '#64748B', marginBottom: 16 }}>
        当前分析界面已暂时下线，等待新的图表方案和展示内容确认后再接入接口数据。
      </p>

      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="数据分析模块暂未开放"
        />
        <div style={{ marginTop: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <InfoCircleOutlined />
          你确认需要展示的图表后，我再按接口逐个接入并完成页面实现。
        </div>
      </Card>
    </div>
  )
}
