import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children in a semantic button', () => {
    render(<Button>Submit</Button>)

    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('maps primary variant to the Ant Design primary class', () => {
    render(<Button variant="primary">Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('ant-btn-primary')
  })

  it('maps secondary variant to the Ant Design default button', () => {
    render(<Button variant="secondary">Back</Button>)

    expect(screen.getByRole('button', { name: 'Back' })).toHaveClass('ant-btn-default')
  })

  it('applies radius and opacity as inline styles', () => {
    render(
      <Button radius="pill" opacity={0.6}>
        Filter
      </Button>
    )

    expect(screen.getByRole('button', { name: 'Filter' })).toHaveStyle({
      borderRadius: 'var(--radius-pill)',
      opacity: '0.6',
    })
  })

  it('does not apply opacity styles outside the 0-1 range', () => {
    render(<Button opacity={1.2}>Visible</Button>)

    expect(screen.getByRole('button', { name: 'Visible' }).style.opacity).toBe('')
  })

  it('calls onClick when activated', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button', { name: 'Click' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick while disabled', () => {
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Locked
      </Button>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Locked' }))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('maps loading and large size to Ant Design state classes', () => {
    render(
      <Button loading size="lg">
        Loading
      </Button>
    )

    const button = screen.getByRole('button', { name: /Loading/ })
    expect(button).toHaveClass('ant-btn-loading')
    expect(button).toHaveClass('ant-btn-lg')
  })

  it('maps danger tone to Ant Design danger styling', () => {
    render(<Button tone="danger">Delete</Button>)

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('ant-btn-dangerous')
  })

  it('merges className, style, and antProps', () => {
    render(
      <Button
        antProps={{ id: 'custom-button' }}
        className="extra-class"
        style={{ marginTop: 4 }}
      >
        Custom
      </Button>
    )

    const button = screen.getByRole('button', { name: 'Custom' })
    expect(button).toHaveClass('extra-class')
    expect(button).toHaveAttribute('id', 'custom-button')
    expect(button).toHaveStyle({ marginTop: '4px' })
  })
})

