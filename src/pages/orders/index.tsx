import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Dropdown, Drawer, Grid, Modal, Space, Table, Tag, Tooltip, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownOutlined, ReloadOutlined, WalletOutlined } from '@ant-design/icons'
import { OrderStatusBadge } from '@/components/orders'
import { paymentApi, type OrderResponse } from '@/services/payment'
import {
  ORDER_STATUS_COLORS,
  canPayOrder,
  formatDateTime,
  formatMoney,
  formatRelativeTime,
  orderStatusLabel,
  paymentChannelLabel,
} from '@/utils/paymentFormat'

const { useBreakpoint } = Grid

export default function OrdersPage() {
  const screens = useBreakpoint()
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get('pageSize')) || 20)
  const [total, setTotal] = useState(0)

  const drawerWidth = useMemo(() => (screens.md ? 640 : '90vw'), [screens.md])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentApi.listMyOrders({ page, page_size: pageSize })
      setOrders(res.data.data.items ?? [])
      setTotal(res.data.data.total ?? 0)
    } catch (err) {
      console.error('加载订单列表失败', err)
      message.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true)
      try {
        const res = await paymentApi.listMyOrders({ page, page_size: pageSize })
        setOrders(res.data.data.items ?? [])
        setTotal(res.data.data.total ?? 0)
      } catch (err) {
        console.error('加载订单列表失败', err)
        message.error('加载订单列表失败')
      } finally {
        setLoading(false)
      }
    }
    void doFetch()
  }, [page, pageSize])

  const openDetail = useCallback(async (orderNo: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await paymentApi.getMyOrder(orderNo)
      setSelectedOrder(res.data.data)
    } catch (err) {
      console.error('加载订单详情失败', err)
      message.error('加载订单详情失败')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    const orderNo = searchParams.get('orderNo')
    if (orderNo) {
      const params = new URLSearchParams(searchParams)
      params.delete('orderNo')
      setSearchParams(params, { replace: true })
      const doOpen = async () => {
        setDetailOpen(true)
        setDetailLoading(true)
        try {
          const res = await paymentApi.getMyOrder(orderNo)
          setSelectedOrder(res.data.data)
        } catch (err) {
          console.error('加载订单详情失败', err)
          message.error('加载订单详情失败')
        } finally {
          setDetailLoading(false)
        }
      }
      void doOpen()
    }
  }, [searchParams, setSearchParams])

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
    setSearchParams(params, { replace: true })
  }, [page, pageSize, searchParams, setSearchParams])

  const applyUpdatedOrder = (order: OrderResponse) => {
    setSelectedOrder(order)
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
          void fetchOrders()
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } }
          message.error(axiosErr.response?.data?.message || 'Mock 支付失败')
        } finally {
          setActionLoading('')
        }
      },
    })
  }

  const handleDetect = async (order: OrderResponse) => {
    setActionLoading(`detect:${order.order_no}`)
    try {
      const res = await paymentApi.detect(order.order_no)
      applyUpdatedOrder(res.data.data)
      message.success('订单状态已刷新')
      void fetchOrders()
    } catch (err) {
      console.error('检测订单状态失败', err)
      message.error('检测订单状态失败')
    } finally {
      setActionLoading('')
    }
  }

  const isOrderActing = (orderNo: string) =>
    actionLoading === `pay:${orderNo}` || actionLoading === `detect:${orderNo}`

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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      responsive: ['md'],
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
            key: 'detect',
            label: '检测状态',
            icon: <ReloadOutlined />,
            disabled: acting,
            onClick: () => void handleDetect(record),
          },
          ...(canPayOrder(record)
            ? [
                {
                  key: 'pay',
                  label: 'Mock 支付',
                  icon: <WalletOutlined />,
                  disabled: acting,
                  onClick: () => handlePay(record),
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

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
            我的订单
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            查看会员订单、执行 Mock 支付并检测权益发放状态。
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void fetchOrders()}>
          刷新
        </Button>
      </Space>

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
        title={selectedOrder ? `订单详情 ${selectedOrder.order_no}` : '订单详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={drawerWidth}
        styles={{ body: { padding: 0 } }}
        loading={detailLoading}
      >
        {selectedOrder && (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {selectedOrder.subject}
                  </Typography.Text>
                  <Tag color="blue">{formatMoney(selectedOrder.amount, selectedOrder.currency)}</Tag>
                </div>
                <OrderStatusBadge
                  orderStatus={selectedOrder.order_status}
                  paymentStatus={selectedOrder.payment_status}
                  entitlementStatus={selectedOrder.entitlement_status}
                />
              </Space>
            </div>

            <div style={{ padding: '16px 24px' }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <DetailRow label="订单号" value={selectedOrder.order_no} />
                <DetailRow label="套餐" value={selectedOrder.plan_code || '-'} />
                <DetailRow
                  label="订单状态"
                  value={<Tag color={ORDER_STATUS_COLORS[selectedOrder.order_status]}>{orderStatusLabel(selectedOrder.order_status)}</Tag>}
                />
                <DetailRow label="支付通道" value={paymentChannelLabel(selectedOrder.payment_channel)} />
                <DetailRow
                  label="创建时间"
                  value={
                    <Tooltip title={formatRelativeTime(selectedOrder.created_at)}>
                      <span>{formatDateTime(selectedOrder.created_at)}</span>
                    </Tooltip>
                  }
                />
                <DetailRow label="过期时间" value={formatDateTime(selectedOrder.expires_at)} />
                <DetailRow label="支付时间" value={formatDateTime(selectedOrder.paid_at)} />
                <DetailRow label="关闭时间" value={formatDateTime(selectedOrder.closed_at)} />
              </Space>
            </div>

            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
              }}
            >
              <Button
                icon={<ReloadOutlined />}
                loading={actionLoading === `detect:${selectedOrder.order_no}`}
                onClick={() => void handleDetect(selectedOrder)}
              >
                检测状态
              </Button>
              <Button
                type="primary"
                icon={<WalletOutlined />}
                disabled={!canPayOrder(selectedOrder)}
                loading={actionLoading === `pay:${selectedOrder.order_no}`}
                onClick={() => handlePay(selectedOrder)}
              >
                Mock 支付
              </Button>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography.Text type="secondary" style={{ fontSize: 14 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 14 }}>{value}</Typography.Text>
    </div>
  )
}
