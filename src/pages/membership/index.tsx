import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, Col, Empty, Modal, Row, Skeleton, Space, Statistic, Tag, Typography, message } from 'antd'
import { AlipayCircleFilled, CheckCircleOutlined, CrownOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createOrderIdempotencyKey, showOrderCreatedSuccess } from '@/components/orders'
import { membershipApi, type CurrentMembership, type MembershipPlan } from '@/services/membership'
import { paymentApi, type PaymentChannel } from '@/services/payment'
import { formatDateTime, formatMoney } from '@/utils/paymentFormat'
import { selectHighlightedPlan } from '@/utils/membershipHighlight'

const { Paragraph, Title } = Typography

export default function MembershipPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [membership, setMembership] = useState<CurrentMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingPlanCode, setCreatingPlanCode] = useState('')
  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER),
      ),
    [plans],
  )
  const highlightedPlanCode = useMemo(
    () => selectHighlightedPlan(sortedPlans, searchParams.get('plan')),
    [sortedPlans, searchParams],
  )
  const highlightedRef = useRef<HTMLDivElement | null>(null)
  const scrolledForKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!highlightedPlanCode || !highlightedRef.current) return
    if (scrolledForKeyRef.current === highlightedPlanCode) return
    highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    scrolledForKeyRef.current = highlightedPlanCode
  }, [highlightedPlanCode])

  const loadData = async () => {
    setLoading(true)
    try {
      const [plansRes, membershipRes] = await Promise.all([
        membershipApi.getPlans(),
        membershipApi.getCurrent(),
      ])
      setPlans(plansRes.data.data ?? [])
      setMembership(membershipRes.data.data)
    } catch {
      message.error('加载会员信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // 创建订单并根据通道分发：
  //   - alipay：拿 pay_url 直接跳支付宝（支付完毕走 ReturnURL 回到本站订单页）
  //   - mock：跳订单页让用户用 Mock 支付按钮模拟回调（仅本地联调使用）
  const handleBuy = (plan: MembershipPlan, channel: PaymentChannel) => {
    Modal.confirm({
      title: `确认购买${plan.plan_name}？`,
      content: `应付金额 ${formatMoney(plan.price_amount, plan.currency)}，订单未支付会在过期后关闭。支付方式：${channel === 'alipay' ? '支付宝' : 'Mock（仅开发）'}。`,
      okText: channel === 'alipay' ? '前往支付宝' : '创建订单',
      cancelText: '取消',
      onOk: async () => {
        setCreatingPlanCode(`${plan.plan_code}:${channel}`)
        try {
          const orderRes = await paymentApi.createOrder({
            plan_code: plan.plan_code,
            idempotency_key: createOrderIdempotencyKey(plan.plan_code),
            channel,
          })
          const order = orderRes.data.data
          if (channel === 'alipay') {
            // 拿 pay_url 之后用 window.location 整页跳转支付宝。等用户付完款，
            // 支付宝会回跳到 ALIPAY_RETURN_URL（应配置成 /orders?orderNo=xxx），
            // 此时订单页会通过 detect 拉一次最新状态。
            const payRes = await paymentApi.payAlipay(order.order_no)
            window.location.href = payRes.data.data.pay_url
            return
          }
          message.success('订单已创建')
          showOrderCreatedSuccess(order, (orderNo) => navigate(`/orders?orderNo=${orderNo}`))
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } }
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
            <Statistic title="会员等级" value={membership?.membership_level || '普通'} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="有效期至" value={formatDateTime(membership?.ends_at)} />
          </Col>
        </Row>
      </Card>

      <Title level={4} style={{ marginTop: 8 }}>可购买套餐</Title>
      {sortedPlans.length === 0 ? (
        <Card>
          <Empty description="暂无可购买会员套餐" />
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {sortedPlans.map((plan) => {
            const isHighlighted = plan.plan_code === highlightedPlanCode
            return (
            <Col xs={24} md={8} key={plan.plan_code}>
              <div ref={isHighlighted ? highlightedRef : undefined}>
              <Card
                title={
                  <Space>
                    <CrownOutlined style={{ color: '#D97706' }} />
                    {plan.plan_name}
                    {isHighlighted && <Tag color="gold" style={{ marginLeft: 8 }}>推荐</Tag>}
                  </Space>
                }
                style={
                  isHighlighted
                    ? {
                        borderColor: '#F59E0B',
                        boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.18)',
                      }
                    : undefined
                }
                extra={<Tag color={plan.status === 'active' ? 'green' : 'default'}>{plan.status}</Tag>}
                actions={[
                  <Button
                    type="primary"
                    icon={<AlipayCircleFilled />}
                    loading={creatingPlanCode === `${plan.plan_code}:alipay`}
                    disabled={plan.status !== 'active' || !!creatingPlanCode}
                    onClick={() => handleBuy(plan, 'alipay')}
                  >
                    支付宝支付
                  </Button>,
                  ...(import.meta.env.DEV
                    ? [
                        <Button
                          icon={<ShoppingCartOutlined />}
                          loading={creatingPlanCode === `${plan.plan_code}:mock`}
                          disabled={plan.status !== 'active' || !!creatingPlanCode}
                          onClick={() => handleBuy(plan, 'mock')}
                        >
                          Mock（开发）
                        </Button>,
                      ]
                    : []),
                ]}
              >
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  <Statistic value={formatMoney(plan.price_amount, plan.currency)} title="套餐价格" />
                  {plan.description && (
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {plan.description}
                    </Paragraph>
                  )}
                  <div>
                    <CheckCircleOutlined style={{ color: '#16A34A', marginRight: 8 }} />
                    有效期 {plan.duration_days} 天
                  </div>
                  <div>
                    <CheckCircleOutlined style={{ color: '#16A34A', marginRight: 8 }} />
                    会员等级 {plan.membership_level}
                  </div>
                  <Alert
                    type="info"
                    showIcon
                    message={import.meta.env.DEV ? '支持支付宝 / Mock 两种支付通道' : '通过支付宝完成支付'}
                  />
                </Space>
              </Card>
              </div>
            </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}
