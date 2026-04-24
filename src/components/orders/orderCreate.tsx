import { Descriptions, Modal, Tag, Typography } from 'antd'
import type { OrderResponse } from '@/services/payment'
import {
  ENTITLEMENT_STATUS_COLORS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  entitlementStatusLabel,
  formatDateTime,
  formatMoney,
  orderStatusLabel,
  paymentChannelLabel,
  paymentStatusLabel,
} from '@/utils/paymentFormat'

export function createOrderIdempotencyKey(planCode: string) {
  return `checkout-${planCode}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function showOrderCreatedSuccess(
  order: OrderResponse,
  onConfirm: (orderNo: string) => void,
) {
  Modal.success({
    title: '订单创建成功',
    width: 480,
    okText: '去支付订单',
    cancelText: '继续查看套餐',
    onOk: () => onConfirm(order.order_no),
    content: (
      <div style={{ marginTop: 16 }}>
        <Descriptions column={1} size="small" labelStyle={{ color: '#64748B' }}>
          <Descriptions.Item label="订单号">
            <Typography.Text copyable>{order.order_no}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="商品">{order.subject}</Descriptions.Item>
          <Descriptions.Item label="金额">
            <Typography.Text strong style={{ color: '#D97706', fontSize: 16 }}>
              {formatMoney(order.amount, order.currency)}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="过期时间">
            {formatDateTime(order.expires_at)}
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={ORDER_STATUS_COLORS[order.order_status]}>
              {orderStatusLabel(order.order_status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付状态">
            <Tag color={PAYMENT_STATUS_COLORS[order.payment_status]}>
              {paymentStatusLabel(order.payment_status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="权益状态">
            <Tag color={ENTITLEMENT_STATUS_COLORS[order.entitlement_status]}>
              {entitlementStatusLabel(order.entitlement_status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付通道">
            {paymentChannelLabel(order.payment_channel)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    ),
  })
}
