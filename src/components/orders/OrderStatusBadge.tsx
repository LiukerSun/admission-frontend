import {
  ENTITLEMENT_STATUS_COLORS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  entitlementStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '@/utils/paymentFormat'
import { StatusStack } from '@/components/ui'

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
  return (
    <StatusStack
      compact={compact}
      items={[
        { label: orderStatusLabel(orderStatus), color: ORDER_STATUS_COLORS[orderStatus] },
        { label: paymentStatusLabel(paymentStatus), color: PAYMENT_STATUS_COLORS[paymentStatus] },
        { label: entitlementStatusLabel(entitlementStatus), color: ENTITLEMENT_STATUS_COLORS[entitlementStatus] },
      ]}
    />
  )
}
