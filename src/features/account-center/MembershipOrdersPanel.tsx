import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Empty, Modal, Row, Skeleton, Space, Statistic, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CheckCircleOutlined, CrownOutlined, ReloadOutlined, ShoppingCartOutlined, WalletOutlined } from '@ant-design/icons'
import { createOrderIdempotencyKey, showOrderCreatedSuccess, OrderStatusBadge } from '@/components/orders'
import { membershipApi, type CurrentMembership, type MembershipPlan } from '@/services/membership'
import { paymentApi, type OrderResponse } from '@/services/payment'
import { canPayOrder, formatDateTime, formatMoney, formatRelativeTime } from '@/utils/paymentFormat'

export default function MembershipOrdersPanel() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [membership, setMembership] = useState<CurrentMembership | null>(null)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [creatingPlanCode, setCreatingPlanCode] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const loadMembership = useCallback(async () => {
    const [plansRes, membershipRes] = await Promise.all([
      membershipApi.getPlans(),
      membershipApi.getCurrent(),
    ])
    setPlans(plansRes.data.data ?? [])
    setMembership(membershipRes.data.data)
  }, [])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await paymentApi.listMyOrders({ page: 1, page_size: 5 })
      setOrders(res.data.data.items ?? [])
    } catch {
      message.error('加载订单列表失败')
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadMembership(), loadOrders()])
    } catch {
      message.error('加载会员与订单信息失败')
    } finally {
      setLoading(false)
    }
  }, [loadMembership, loadOrders])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

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
          showOrderCreatedSuccess(order, () => void loadOrders())
          await loadOrders()
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } }
          message.error(axiosErr.response?.data?.message || '创建订单失败')
        } finally {
          setCreatingPlanCode('')
        }
      },
    })
  }

  const applyUpdatedOrder = (order: OrderResponse) => {
    setOrders((current) => current.map((item) => (item.order_no === order.order_no ? order : item)))
  }

  const handlePay = (order: OrderResponse) => {
    Modal.confirm({
      title: '确认执行 Mock 支付？',
      content: `订单 ${order.order_no} 将调用本地 Mock 支付接口完成支付和会员权益发放。`,
      okText: 'Mock 支付',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(`pay:${order.order_no}`)
        try {
          const res = await paymentApi.payMock(order.order_no)
          applyUpdatedOrder(res.data.data)
          message.success('Mock 支付成功')
          await Promise.all([loadMembership(), loadOrders()])
        } catch {
          message.error('Mock 支付失败')
        } finally {
          setActionLoading('')
        }
      },
    })
  }

  const columns: ColumnsType<OrderResponse> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '商品',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: '金额',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (_, record) => <strong>{formatMoney(record.amount, record.currency)}</strong>,
    },
    {
      title: '状态',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <OrderStatusBadge
          orderStatus={record.order_status}
          paymentStatus={record.payment_status}
          entitlementStatus={record.entitlement_status}
          compact
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (value: string) => formatRelativeTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          icon={<WalletOutlined />}
          disabled={!canPayOrder(record)}
          loading={actionLoading === `pay:${record.order_no}`}
          onClick={() => handlePay(record)}
        >
          Mock 支付
        </Button>
      ),
    },
  ]

  if (loading) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card>
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
            <Statistic title="会员等级" value={membership?.membership_level || 'premium'} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="有效期至" value={formatDateTime(membership?.ends_at)} />
          </Col>
        </Row>
      </Card>

      <div>
        <h3 style={{ marginTop: 0 }}>可购买套餐</h3>
        {plans.length === 0 ? (
          <Card>
            <Empty description="暂无可购买会员套餐" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
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
                    <Alert type="info" showIcon message="支付方式：Mock 支付" />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <Card
        title="最近订单"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void loadOrders()}>
            刷新
          </Button>
        }
      >
        <Table
          rowKey="order_no"
          columns={columns}
          dataSource={orders}
          loading={ordersLoading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: '暂无订单数据' }}
        />
      </Card>
    </Space>
  )
}
