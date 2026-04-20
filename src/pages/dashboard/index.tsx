import { Card, Statistic, Row, Col } from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons'

export default function DashboardPage() {
  return (
    <div>
      <h2>控制台</h2>
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="已完成分析"
              value={12}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="收藏院校"
              value={5}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="对比方案"
              value={3}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
