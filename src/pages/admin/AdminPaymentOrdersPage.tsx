import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownOutlined, ReloadOutlined } from '@ant-design/icons'
import { OrderStatusBadge } from '@/components/orders'
import {
  paymentApi,
  type AdminOrderDetailResponse,
  type AdminOrderListQuery,
  type OrderResponse,
  type PaymentAttempt,
  type PaymentCallback,
} from '@/services/payment'
import {
  ENTITLEMENT_STATUS_COLORS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  canPayOrder,
  entitlementStatusLabel,
  formatDateTime,
  formatMoney,
  formatRelativeTime,
  isPaidOrder,
  orderStatusLabel,
  paymentChannelLabel,
  paymentStatusLabel,
} from '@/utils/paymentFormat'

const { useBreakpoint } = Grid

interface FilterValues {
  order_no?: string
  user_id?: number
  plan_code?: string
  channel?: string
  order_status?: string
}

export default function AdminPaymentOrdersPage() {
  const screens = useBreakpoint()
  const [searchParams, setSearchParams] = useSearchParams()
  const [form] = Form.useForm<FilterValues>()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [detail, setDetail] = useState<AdminOrderDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userOrdersDrawerOpen, setUserOrdersDrawerOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userOrders, setUserOrders] = useState<OrderResponse[]>([])
  const [userOrdersLoading, setUserOrdersLoading] = useState(false)
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('pageSize')) || 20)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<FilterValues>(() => {
    return {
      order_no: searchParams.get('order_no') || undefined,
      user_id: searchParams.get('user_id') ? Number(searchParams.get('user_id')) : undefined,
      plan_code: searchParams.get('plan_code') || undefined,
      channel: searchParams.get('channel') || undefined,
      order_status: searchParams.get('order_status') || undefined,
    }
  })

  const drawerWidth = useMemo(() => (screens.md ? 720 : '90vw'), [screens.md])

  useEffect(() => {
    form.setFieldsValue(filters)
  }, [filters, form])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params: AdminOrderListQuery = {
        page,
        page_size: pageSize,
        ...filters,
      }
      const res = await paymentApi.adminListOrders(params)
      setOrders(res.data.data.items ?? [])
      setTotal(res.data.data.total ?? 0)
    } catch {
      message.error('加载支付订单失败')
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchOrders()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchOrders])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
    if (pageSize !== 20) {
      params.set('pageSize', String(pageSize))
    } else {
      params.delete('pageSize')
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })
    setSearchParams(params, { replace: true })
  }, [filters, page, pageSize, searchParams, setSearchParams])

  const openDetail = async (orderNo: string) => {
    setDrawerOpen(true)
    setDetailLoading(true)
    try {
      const res = await paymentApi.adminGetOrder(orderNo)
      setDetail(res.data.data)
    } catch {
      message.error('加载订单详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const openUserOrders = async (userId: number) => {
    setSelectedUserId(userId)
    setUserOrdersDrawerOpen(true)
    setUserOrdersLoading(true)
    try {
      const res = await paymentApi.adminListOrders({ user_id: userId, page: 1, page_size: 100 })
      setUserOrders(res.data.data.items ?? [])
    } catch {
      message.error('加载用户订单失败')
    } finally {
      setUserOrdersLoading(false)
    }
  }

  const applyUpdatedOrder = (order: OrderResponse) => {
    setOrders((current) => current.map((item) => (item.order_no === order.order_no ? order : item)))
    setDetail((current) => (current ? { ...current, order } : current))
  }

  const runOrderAction = (order: OrderResponse, action: 'close' | 'redetect' | 'regrant') => {
    const actionText = {
      close: '关闭订单',
      redetect: '重新检测',
      regrant: '补发会员',
    }[action]

    Modal.confirm({
      title: `确认${actionText}？`,
      content: `订单号：${order.order_no}`,
      okText: actionText,
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(`${action}:${order.order_no}`)
        try {
          const res =
            action === 'close'
              ? await paymentApi.adminCloseOrder(order.order_no)
              : action === 'redetect'
                ? await paymentApi.adminRedetect(order.order_no)
                : await paymentApi.adminRegrantMembership(order.order_no)
          applyUpdatedOrder(res.data.data)
          message.success(`${actionText}成功`)
          void fetchOrders()
          if (drawerOpen) {
            void openDetail(order.order_no)
          }
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } }
          message.error(axiosErr.response?.data?.message || `${actionText}失败`)
        } finally {
          setActionLoading('')
        }
      },
    })
  }

  const handleSearch = async () => {
    const values = await form.validateFields()
    setPage(1)
    setFilters(values)
  }

  const handleReset = () => {
    form.resetFields()
    setPage(1)
    setFilters({})
  }

  const isOrderActing = (orderNo: string) =>
    ['close', 'redetect', 'regrant'].some((a) => actionLoading === `${a}:${orderNo}`)

  const columns: ColumnsType<OrderResponse> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      fixed: 'left',
      width: 180,
      render: (value: string) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => void openDetail(value)}>
          {value}
        </Button>
      ),
    },
    {
      title: '用户 ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      responsive: ['md'],
      render: (value?: number) =>
        value ? (
          <Button type="link" style={{ padding: 0 }} onClick={() => void openUserOrders(value)}>
            {value}
          </Button>
        ) : (
          '-'
        ),
    },
    {
      title: '套餐',
      dataIndex: 'plan_code',
      key: 'plan_code',
      width: 100,
      render: (value) => value || '-',
    },
    {
      title: '商品',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      minWidth: 120,
    },
    {
      title: '金额',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
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
      title: '通道',
      dataIndex: 'payment_channel',
      key: 'payment_channel',
      width: 100,
      responsive: ['md'],
      render: paymentChannelLabel,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      responsive: ['lg'],
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (value: string) => (
        <Tooltip title={formatDateTime(value)}>
          <span>{formatRelativeTime(value)}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => {
        const acting = isOrderActing(record.order_no)
        const items = [
          {
            key: 'detail',
            label: '查看详情',
            disabled: acting,
            onClick: () => void openDetail(record.order_no),
          },
          {
            key: 'redetect',
            label: '重新检测',
            disabled: acting,
            onClick: () => runOrderAction(record, 'redetect'),
          },
          ...(canPayOrder(record)
            ? [
                {
                  key: 'close',
                  label: '关闭订单',
                  danger: true,
                  disabled: acting,
                  onClick: () => runOrderAction(record, 'close'),
                },
              ]
            : []),
          ...(isPaidOrder(record)
            ? [
                {
                  key: 'regrant',
                  label: '补发会员',
                  disabled: acting,
                  onClick: () => runOrderAction(record, 'regrant'),
                },
              ]
            : []),
        ]

        return (
          <Space>
            <Button size="small" disabled={acting} onClick={() => void openDetail(record.order_no)}>
              详情
            </Button>
            <Dropdown menu={{ items }} placement="bottomRight">
              <Button size="small" loading={acting} disabled={acting}>
                更多 <DownOutlined style={{ fontSize: 12 }} />
              </Button>
            </Dropdown>
          </Space>
        )
      },
    },
  ]

  const attemptColumns: ColumnsType<PaymentAttempt> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '次数', dataIndex: 'attempt_no', key: 'attempt_no', width: 70 },
    { title: '通道', dataIndex: 'channel', key: 'channel', width: 90 },
    {
      title: '通道交易号',
      dataIndex: 'channel_trade_no',
      key: 'channel_trade_no',
      ellipsis: true,
      render: (value) => value || '-',
    },
    { title: '状态', dataIndex: 'channel_status', key: 'channel_status', width: 90 },
    {
      title: '金额',
      key: 'amount',
      width: 100,
      align: 'right',
      render: (_, record) => formatMoney(record.amount),
    },
    {
      title: '成功时间',
      dataIndex: 'success_at',
      key: 'success_at',
      width: 160,
      responsive: ['md'],
      render: formatDateTime,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      responsive: ['lg'],
      render: formatDateTime,
    },
  ]

  const callbackColumns: ColumnsType<PaymentCallback> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '回调 ID', dataIndex: 'callback_id', key: 'callback_id', ellipsis: true },
    { title: '通道', dataIndex: 'channel', key: 'channel', width: 90 },
    {
      title: '通道交易号',
      dataIndex: 'channel_trade_no',
      key: 'channel_trade_no',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '已处理',
      dataIndex: 'processed',
      key: 'processed',
      width: 80,
      render: (value: boolean) => (value ? <Tag color="success">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '处理时间',
      dataIndex: 'processed_at',
      key: 'processed_at',
      width: 160,
      responsive: ['md'],
      render: formatDateTime,
    },
    {
      title: '错误',
      dataIndex: 'process_error',
      key: 'process_error',
      ellipsis: true,
      responsive: ['lg'],
      render: (value) => value || '-',
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
            支付订单管理
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            查看订单、支付尝试、回调记录，并处理会员权益发放问题。
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void fetchOrders()}>
          刷新
        </Button>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout={screens.md ? 'inline' : 'vertical'}
          className="admin-filter-form"
        >
          <Form.Item name="order_no" label="订单号" style={{ marginBottom: 8 }}>
            <Input placeholder="订单号" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="user_id" label="用户 ID" style={{ marginBottom: 8 }}>
            <InputNumber min={1} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="plan_code" label="套餐" style={{ marginBottom: 8 }}>
            <Select
              allowClear
              style={{ width: 120 }}
              options={[
                { value: 'monthly', label: 'monthly' },
                { value: 'quarterly', label: 'quarterly' },
                { value: 'yearly', label: 'yearly' },
              ]}
            />
          </Form.Item>
          <Form.Item name="channel" label="通道" style={{ marginBottom: 8 }}>
            <Select allowClear style={{ width: 120 }} options={[{ value: 'mock', label: 'mock' }]} />
          </Form.Item>
          <Form.Item name="order_status" label="订单状态" style={{ marginBottom: 8 }}>
            <Select
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'awaiting_payment', label: '待支付' },
                { value: 'paid', label: '已支付' },
                { value: 'fulfilled', label: '已完成' },
                { value: 'closed', label: '已关闭' },
                { value: 'failed', label: '失败' },
              ]}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Space>
              <Button type="primary" onClick={() => void handleSearch()}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Table
        rowKey="order_no"
        columns={columns}
        dataSource={orders}
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage)
            setPageSize(nextPageSize)
          },
        }}
        locale={{
          emptyText: (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Typography.Text type="secondary">暂无订单数据</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Button type="primary" icon={<ReloadOutlined />} onClick={() => void fetchOrders()}>
                  刷新
                </Button>
              </div>
            </div>
          ),
        }}
      />

      <Drawer
        title={detail ? `订单详情 ${detail.order.order_no}` : '订单详情'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={drawerWidth}
        styles={{ body: { padding: 0 } }}
        loading={detailLoading}
        extra={
          detail && (
            <Space>
              <Button
                loading={actionLoading === `close:${detail.order.order_no}`}
                disabled={!canPayOrder(detail.order)}
                onClick={() => runOrderAction(detail.order, 'close')}
              >
                关闭订单
              </Button>
              <Button
                loading={actionLoading === `redetect:${detail.order.order_no}`}
                onClick={() => runOrderAction(detail.order, 'redetect')}
              >
                重新检测
              </Button>
              <Button
                type="primary"
                loading={actionLoading === `regrant:${detail.order.order_no}`}
                disabled={!isPaidOrder(detail.order)}
                onClick={() => runOrderAction(detail.order, 'regrant')}
              >
                补发会员
              </Button>
            </Space>
          )
        }
      >
        {detail && (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {detail.order.subject}
                  </Typography.Text>
                  <Tag color="blue">{formatMoney(detail.order.amount, detail.order.currency)}</Tag>
                </div>
                <OrderStatusBadge
                  orderStatus={detail.order.order_status}
                  paymentStatus={detail.order.payment_status}
                  entitlementStatus={detail.order.entitlement_status}
                />
              </Space>
            </div>

            <div style={{ padding: '16px 24px' }}>
              <Descriptions
                column={{ xs: 1, sm: 2 }}
                labelStyle={{ color: '#64748B', width: 90 }}
                contentStyle={{ fontWeight: 500 }}
              >
                <Descriptions.Item label="订单号">{detail.order.order_no}</Descriptions.Item>
                <Descriptions.Item label="用户 ID">{detail.user_id ?? detail.order.user_id ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="套餐">{detail.order.plan_code || '-'}</Descriptions.Item>
                <Descriptions.Item label="商品">{detail.order.subject}</Descriptions.Item>
                <Descriptions.Item label="金额">{formatMoney(detail.order.amount, detail.order.currency)}</Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  <Tag color={ORDER_STATUS_COLORS[detail.order.order_status]}>{orderStatusLabel(detail.order.order_status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="支付状态">
                  <Tag color={PAYMENT_STATUS_COLORS[detail.order.payment_status]}>{paymentStatusLabel(detail.order.payment_status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="权益状态">
                  <Tag color={ENTITLEMENT_STATUS_COLORS[detail.order.entitlement_status]}>{entitlementStatusLabel(detail.order.entitlement_status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="通道">{paymentChannelLabel(detail.order.payment_channel)}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  <Tooltip title={formatRelativeTime(detail.order.created_at)}>
                    <span>{formatDateTime(detail.order.created_at)}</span>
                  </Tooltip>
                </Descriptions.Item>
                <Descriptions.Item label="过期时间">{formatDateTime(detail.order.expires_at)}</Descriptions.Item>
                <Descriptions.Item label="支付时间">{formatDateTime(detail.order.paid_at)}</Descriptions.Item>
                <Descriptions.Item label="关闭时间">{formatDateTime(detail.order.closed_at)}</Descriptions.Item>
              </Descriptions>
            </div>

            <Divider style={{ margin: 0 }} />

            <div style={{ padding: '16px 24px' }}>
              <Tabs
                items={[
                  {
                    key: 'attempts',
                    label: '支付尝试',
                    children: (
                      <Table
                        rowKey="id"
                        columns={attemptColumns}
                        dataSource={detail.attempts ?? []}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: '暂无支付尝试记录' }}
                      />
                    ),
                  },
                  {
                    key: 'callbacks',
                    label: '回调记录',
                    children: (
                      <Table
                        rowKey="id"
                        columns={callbackColumns}
                        dataSource={detail.callbacks ?? []}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: '暂无回调记录' }}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </Space>
        )}
      </Drawer>

      <Drawer
        title={selectedUserId ? `用户 ${selectedUserId} 的订单` : '用户订单'}
        open={userOrdersDrawerOpen}
        onClose={() => setUserOrdersDrawerOpen(false)}
        width={drawerWidth}
      >
        <Table
          rowKey="order_no"
          columns={columns.filter((c) => c.key !== 'user_id')}
          dataSource={userOrders}
          loading={userOrdersLoading}
          scroll={{ x: 'max-content' }}
          pagination={false}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Typography.Text type="secondary">该用户暂无订单</Typography.Text>
              </div>
            ),
          }}
        />
      </Drawer>
    </div>
  )
}
