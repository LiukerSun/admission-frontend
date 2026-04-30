import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PageHeader, StatusStack, SmartEmptyState } from './index'

describe('soft ui primitives', () => {
  it('renders page header title and description', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageHeader, {
        title: '我的控制台',
        description: '查看你的志愿填报进度',
        eyebrow: '工作台',
      })
    )

    expect(html).toContain('我的控制台')
    expect(html).toContain('查看你的志愿填报进度')
    expect(html).toContain('工作台')
  })

  it('renders status labels without AntD tag color coupling', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusStack, {
        items: [
          { label: '待支付', tone: 'amber' },
          { label: '已发放', tone: 'green' },
        ],
      })
    )

    expect(html).toContain('待支付')
    expect(html).toContain('已发放')
    expect(html).toContain('softStatusPill')
  })

  it('renders an honest empty state action', () => {
    const html = renderToStaticMarkup(
      React.createElement(SmartEmptyState, {
        title: '数据分析模块暂未开放',
        description: '确认图表方案后再接入接口数据。',
        actionText: '返回控制台',
      })
    )

    expect(html).toContain('数据分析模块暂未开放')
    expect(html).toContain('确认图表方案后再接入接口数据')
    expect(html).toContain('返回控制台')
  })
})
