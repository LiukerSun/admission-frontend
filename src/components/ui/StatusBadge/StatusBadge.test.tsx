import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the label', () => {
    render(<StatusBadge label="已激活" />)

    expect(screen.getByText('已激活')).toBeInTheDocument()
  })

  it('renders a dot in dot variant', () => {
    const { container } = render(<StatusBadge label="在线" variant="dot" />)

    expect(container.querySelector('[data-slot="dot"]')).toBeInTheDocument()
  })

  it('does not render a dot in text variant', () => {
    const { container } = render(<StatusBadge label="离线" variant="text" />)

    expect(container.querySelector('[data-slot="dot"]')).toBeNull()
  })

  it('applies pulse class when enabled', () => {
    const { container } = render(<StatusBadge label="同步中" pulse variant="dot" />)

    expect(container.querySelector('[data-slot="dot"]')).toHaveClass('pulse')
  })

  it('maps tone, size, and variant to CSS module class names', () => {
    const { container } = render(<StatusBadge label="失败" size="sm" tone="danger" variant="filled" />)

    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('toneDanger')
    expect(root).toHaveClass('sizeSm')
    expect(root).toHaveClass('variantFilled')
  })

  it('merges className and style', () => {
    const { container } = render(<StatusBadge className="extra-class" label="已完成" style={{ marginLeft: 6 }} />)

    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('extra-class')
    expect(root).toHaveStyle({ marginLeft: '6px' })
  })
})
