import { Space, Tag } from 'antd'
import {
  ENTITLEMENT_STATUS_COLORS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  entitlementStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '@/utils/paymentFormat'

interface OrderStatusBadgeProps {
  orderStatus: string
  paymentStatus: string
  entitlementStatus: string
  compact?: boolean
}

export default function OrderStatusBadge({
  orderStatus,
  paymentStatus,
  entitlementStatus,
  compact = false,
}: OrderStatusBadgeProps) {
  if (compact) {
    return (
      <Space direction="vertical" size={2}>
        <Tag color={ORDER_STATUS_COLORS[orderStatus]} style={{ margin: 0, fontSize: 12 }}>
          {orderStatusLabel(orderStatus)}
        </Tag>
        <Tag color={PAYMENT_STATUS_COLORS[paymentStatus]} style={{ margin: 0, fontSize: 12 }}>
          {paymentStatusLabel(paymentStatus)}
        </Tag>
        <Tag color={ENTITLEMENT_STATUS_COLORS[entitlementStatus]} style={{ margin: 0, fontSize: 12 }}>
          {entitlementStatusLabel(entitlementStatus)}
        </Tag>
      </Space>
    )
  }

  return (
    <Space wrap>
      <Tag color={ORDER_STATUS_COLORS[orderStatus]}>{orderStatusLabel(orderStatus)}</Tag>
      <Tag color={PAYMENT_STATUS_COLORS[paymentStatus]}>{paymentStatusLabel(paymentStatus)}</Tag>
      <Tag color={ENTITLEMENT_STATUS_COLORS[entitlementStatus]}>{entitlementStatusLabel(entitlementStatus)}</Tag>
    </Space>
  )
}
