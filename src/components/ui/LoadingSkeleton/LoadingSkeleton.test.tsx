import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingSkeleton } from './LoadingSkeleton'

describe('LoadingSkeleton', () => {
  it('renders text skeleton lines by default', () => {
    const { container } = render(<LoadingSkeleton />)

    expect(container.querySelectorAll('[data-slot="line"]')).toHaveLength(3)
    expect(container.firstChild).toHaveAttribute('data-variant', 'text')
  })

  it('respects rows for text variant', () => {
    const { container } = render(<LoadingSkeleton rows={5} variant="text" />)

    expect(container.querySelectorAll('[data-slot="line"]')).toHaveLength(5)
  })

  it('renders card variant blocks', () => {
    const { container } = render(<LoadingSkeleton variant="card" />)

    expect(container.firstChild).toHaveAttribute('data-variant', 'card')
    expect(container.querySelector('[data-slot="title"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="body"]')).toBeInTheDocument()
  })

  it('renders chart variant blocks', () => {
    const { container } = render(<LoadingSkeleton variant="chart" />)

    expect(container.firstChild).toHaveAttribute('data-variant', 'chart')
    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument()
  })

  it('renders table rows', () => {
    const { container } = render(<LoadingSkeleton rows={4} variant="table" />)

    expect(container.querySelectorAll('[data-slot="row"]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-slot="cell"]')).toHaveLength(12)
  })

  it('applies width and height in custom variant', () => {
    const { container } = render(<LoadingSkeleton height={48} variant="custom" width={120} />)

    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('data-variant', 'custom')
    expect(root).toHaveStyle({ width: '120px', height: '48px' })
  })

  it('merges className and style', () => {
    const { container } = render(<LoadingSkeleton className="extra-class" style={{ marginTop: 10 }} />)

    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('extra-class')
    expect(root).toHaveStyle({ marginTop: '10px' })
  })
})
