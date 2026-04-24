import type { EntitlementStatus, OrderResponse, OrderStatus, PaymentChannel, PaymentStatus } from '@/services/payment'

export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: '已创建',
  awaiting_payment: '待支付',
  paid: '已支付',
  fulfilled: '已完成',
  closed: '已关闭',
  failed: '失败',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: '未支付',
  paying: '支付中',
  paid: '已支付',
  failed: '支付失败',
}

export const ENTITLEMENT_STATUS_LABELS: Record<string, string> = {
  pending: '待发放',
  granted: '已发放',
  failed: '发放失败',
}

export const PAYMENT_CHANNEL_LABELS: Record<string, string> = {
  mock: 'Mock 支付',
}

// Colors aligned with Design System
// Primary #1E40AF, Secondary #3B82F6, Accent #D97706, Destructive #DC2626
export const ORDER_STATUS_COLORS: Record<string, string> = {
  created: '#94A3B8',
  awaiting_payment: '#D97706',
  paid: '#3B82F6',
  fulfilled: '#10B981',
  closed: '#94A3B8',
  failed: '#DC2626',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: '#94A3B8',
  paying: '#D97706',
  paid: '#10B981',
  failed: '#DC2626',
}

export const ENTITLEMENT_STATUS_COLORS: Record<string, string> = {
  pending: '#D97706',
  granted: '#10B981',
  failed: '#DC2626',
}

export function formatMoney(amount: number, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount || 0)
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString()
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  return date.toLocaleDateString()
}

export function orderStatusLabel(status?: OrderStatus | string) {
  return status ? ORDER_STATUS_LABELS[status] || status : '-'
}

export function paymentStatusLabel(status?: PaymentStatus | string) {
  return status ? PAYMENT_STATUS_LABELS[status] || status : '-'
}

export function entitlementStatusLabel(status?: EntitlementStatus | string) {
  return status ? ENTITLEMENT_STATUS_LABELS[status] || status : '-'
}

export function paymentChannelLabel(channel?: PaymentChannel) {
  return channel ? PAYMENT_CHANNEL_LABELS[channel] || channel : '-'
}

export function canPayOrder(order?: Pick<OrderResponse, 'order_status' | 'payment_status'> | null) {
  return order?.order_status === 'awaiting_payment' && order.payment_status === 'unpaid'
}

export function isPaidOrder(order?: Pick<OrderResponse, 'payment_status'> | null) {
  return order?.payment_status === 'paid'
}
