import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../Button/Button'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders the title as text content', () => {
    render(<PageHeader title="用户管理" />)

    expect(screen.getByText('用户管理')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<PageHeader subtitle="管理系统注册用户" title="用户管理" />)

    expect(screen.getByText('管理系统注册用户')).toBeInTheDocument()
  })

  it('renders actions region when provided', () => {
    render(<PageHeader actions={<Button>添加</Button>} title="用户管理" />)

    expect(screen.getByRole('button', { name: '添加' })).toBeInTheDocument()
  })

  it('applies bottom radius via inline styles', () => {
    const { container } = render(<PageHeader bottomRadius="lg" title="用户管理" />)

    const root = container.firstChild as HTMLElement
    expect(root).toHaveStyle({
      borderBottomLeftRadius: 'var(--radius-lg)',
      borderBottomRightRadius: 'var(--radius-lg)',
    })
  })

  it('maps tone and collapse breakpoint to CSS module class names', () => {
    const { container } = render(<PageHeader collapseBreakpoint="lg" tone="success" title="用户管理" />)

    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('toneSuccess')
    expect(root).toHaveClass('collapseLg')
  })

  it('merges className and style', () => {
    const { container } = render(<PageHeader className="extra-class" style={{ marginTop: 8 }} title="用户管理" />)

    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('extra-class')
    expect(root).toHaveStyle({ marginTop: '8px' })
  })
})
