import { Button, Card, Row, Col, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const { Title, Paragraph } = Typography

export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #1a5fb4 0%, #3584e4 100%)',
          color: '#fff',
          padding: 'clamp(48px, 10vw, 80px) 24px',
          textAlign: 'center',
        }}
      >
        <Title style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 40px)' }}>志愿报考分析平台</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px, 2.5vw, 18px)' }}>
          智能推荐、分数预测、院校对比，助力精准填报
        </Paragraph>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
        >
          {isAuthenticated ? '进入工作台' : '立即注册'}
        </Button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card title="智能推荐" variant="outlined">
              基于历年录取数据，智能推荐最适合您的院校与专业
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="分数预测" variant="outlined">
              结合历年分数线与排名，精准预测录取概率
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="院校对比" variant="outlined">
              多维度对比目标院校，辅助科学决策
            </Card>
          </Col>
        </Row>
      </div>

      <div style={{ background: '#f0f2f5', padding: '48px 24px', textAlign: 'center' }}>
        <Title level={3}>平台数据</Title>
        <Row gutter={[24, 24]} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Col xs={12} md={6}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a5fb4' }}>3000+</div>
            <div>覆盖院校</div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a5fb4' }}>10万+</div>
            <div>历年数据</div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a5fb4' }}>50万+</div>
            <div>服务用户</div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a5fb4' }}>98%</div>
            <div>用户满意度</div>
          </Col>
        </Row>
        <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
          * 以上数据为示例，仅供参考
        </Paragraph>
      </div>
    </div>
  )
}
