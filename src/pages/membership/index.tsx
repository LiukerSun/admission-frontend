import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd'
import { CheckCircleOutlined, CrownOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { createOrderIdempotencyKey, showOrderCreatedSuccess } from '@/components/orders'
import { membershipApi, type CurrentMembership, type MembershipPlan } from '@/services/membership'
import { paymentApi } from '@/services/payment'
import { formatDateTime, formatMoney } from '@/utils/paymentFormat'

const { Paragraph, Title } = Typography

export default function MembershipPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [membership, setMembership] = useState<CurrentMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingPlanCode, setCreatingPlanCode] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [plansRes, membershipRes] = await Promise.all([
          membershipApi.getPlans(),
          membershipApi.getCurrent(),
        ])
        setPlans(plansRes.data.data ?? [])
        setMembership(membershipRes.data.data)
      } catch (err) {
        console.error('加载会员信息失败', err)
        message.error('加载会员信息失败')
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  const handleCreateOrder = (plan: MembershipPlan) => {
    Modal.confirm({
      title: `确认购买${plan.plan_name}？`,
      content: `应付金额 ${formatMoney(plan.price_amount, plan.currency)}，订单将在后端指定时间后过期。`,
      okText: '创建订单',
      cancelText: '取消',
      onOk: async () => {
        setCreatingPlanCode(plan.plan_code)
        try {
          const res = await paymentApi.createOrder({
            plan_code: plan.plan_code,
            idempotency_key: createOrderIdempotencyKey(plan.plan_code),
          })
          const order = res.data.data
          message.success('订单已创建')
          showOrderCreatedSuccess(order, (orderNo) => navigate(`/orders?orderNo=${orderNo}`))
        } catch (err: unknown) {
          const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
          message.error(axiosErr.response?.data?.message || '创建订单失败')
        } finally {
          setCreatingPlanCode('')
        }
      },
    })
  }

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }} align="start">
        <div>
          <h2 style={{ marginBottom: 4 }}>会员中心</h2>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            选择会员套餐创建订单，当前支付通道为 Mock 支付，适合本地联调订单和权益发放流程。
          </Paragraph>
        </div>
        <Button onClick={() => navigate('/orders')}>查看我的订单</Button>
      </Space>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8}>
            <Statistic
              title="当前会员状态"
              value={membership?.active ? '已开通' : '未开通'}
              prefix={<CrownOutlined />}
              valueStyle={{ color: membership?.active ? '#16A34A' : '#64748B' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="会员等级" value={membership?.membership_level || '-'} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="有效期至" value={formatDateTime(membership?.ends_at)} />
          </Col>
        </Row>
      </Card>

      <Title level={4} style={{ marginTop: 8 }}>可购买套餐</Title>
      {plans.length === 0 ? (
        <Card>
          <Empty description="暂无可购买会员套餐" />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {plans.map((plan) => (
            <Col xs={24} md={8} key={plan.plan_code}>
              <Card
                title={
                  <Space>
                    <CrownOutlined style={{ color: '#D97706' }} />
                    {plan.plan_name}
                  </Space>
                }
                extra={<Tag color={plan.status === 'active' ? 'green' : 'default'}>{plan.status}</Tag>}
                actions={[
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    loading={creatingPlanCode === plan.plan_code}
                    disabled={plan.status !== 'active'}
                    onClick={() => handleCreateOrder(plan)}
                  >
                    购买套餐
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Statistic value={formatMoney(plan.price_amount, plan.currency)} title="套餐价格" />
                  <div>
                    <CheckCircleOutlined style={{ color: '#16A34A', marginRight: 8 }} />
                    有效期 {plan.duration_days} 天
                  </div>
                  <div>
                    <CheckCircleOutlined style={{ color: '#16A34A', marginRight: 8 }} />
                    会员等级 {plan.membership_level}
                  </div>
                  <Alert type="info" showIcon message="支付方式：Mock 支付" />
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
