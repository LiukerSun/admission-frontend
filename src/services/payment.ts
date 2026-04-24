import api from './api'

export type OrderStatus = 'created' | 'awaiting_payment' | 'paid' | 'fulfilled' | 'closed' | 'failed'
export type PaymentStatus = 'unpaid' | 'paying' | 'paid' | 'failed'
export type EntitlementStatus = 'pending' | 'granted' | 'failed'
export type PaymentChannel = 'mock' | string

export interface CreateOrderRequest {
  plan_code: string
  idempotency_key?: string
}

export interface OrderResponse {
  order_no: string
  user_id?: number
  plan_code?: string
  subject: string
  amount: number
  currency: string
  order_status: OrderStatus | string
  payment_status: PaymentStatus | string
  entitlement_status: EntitlementStatus | string
  payment_channel: PaymentChannel
  expires_at: string
  paid_at?: string
  closed_at?: string
  created_at: string
}

export interface OrderListResponse {
  items: OrderResponse[]
  total: number
  page: number
  page_size: number
}

export interface PaymentAttempt {
  id: number
  payment_order_id: number
  attempt_no: number
  channel: string
  channel_trade_no?: string
  channel_status: string
  amount: number
  callback_received_at?: string
  success_at?: string
  failed_at?: string
  created_at: string
  updated_at: string
}

export interface PaymentCallback {
  id: number
  channel: string
  callback_id: string
  channel_trade_no?: string
  processed: boolean
  processed_at?: string
  process_error?: string
  created_at: string
}

export interface AdminOrderDetailResponse {
  order: OrderResponse
  user_id?: number
  attempts: PaymentAttempt[]
  callbacks: PaymentCallback[]
}

export interface OrderListQuery {
  page?: number
  page_size?: number
}

export interface AdminOrderListQuery extends OrderListQuery {
  order_no?: string
  user_id?: number
  plan_code?: string
  channel?: string
  order_status?: string
}

export const paymentApi = {
  createOrder: (data: CreateOrderRequest) =>
    api.post<{ data: OrderResponse }>('/api/v1/payment/orders', data),

  listMyOrders: (params?: OrderListQuery) =>
    api.get<{ data: OrderListResponse }>('/api/v1/payment/orders', { params }),

  getMyOrder: (orderNo: string) =>
    api.get<{ data: OrderResponse }>(`/api/v1/payment/orders/${orderNo}`),

  payMock: (orderNo: string) =>
    api.post<{ data: OrderResponse }>(`/api/v1/payment/orders/${orderNo}/pay`),

  detect: (orderNo: string) =>
    api.post<{ data: OrderResponse }>(`/api/v1/payment/orders/${orderNo}/detect`),

  adminListOrders: (params?: AdminOrderListQuery) =>
    api.get<{ data: OrderListResponse }>('/api/v1/admin/payment/orders', { params }),

  adminGetOrder: (orderNo: string) =>
    api.get<{ data: AdminOrderDetailResponse }>(`/api/v1/admin/payment/orders/${orderNo}`),

  adminCloseOrder: (orderNo: string) =>
    api.post<{ data: OrderResponse }>(`/api/v1/admin/payment/orders/${orderNo}/close`),

  adminRedetect: (orderNo: string) =>
    api.post<{ data: OrderResponse }>(`/api/v1/admin/payment/orders/${orderNo}/redetect`),

  adminRegrantMembership: (orderNo: string) =>
    api.post<{ data: OrderResponse }>(`/api/v1/admin/payment/orders/${orderNo}/regrant-membership`),
}
