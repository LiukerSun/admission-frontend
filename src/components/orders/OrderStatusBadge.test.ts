import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import OrderStatusBadge from './OrderStatusBadge'

describe('OrderStatusBadge', () => {
  it('renders compact payment states through the shared soft status style', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderStatusBadge, {
        orderStatus: 'awaiting_payment',
        paymentStatus: 'unpaid',
        entitlementStatus: 'pending',
        compact: true,
      })
    )

    expect(html).toContain('待支付')
    expect(html).toContain('未支付')
    expect(html).toContain('待发放')
    expect(html).toContain('softStatusPill')
    expect(html).not.toContain('ant-tag')
  })
})
