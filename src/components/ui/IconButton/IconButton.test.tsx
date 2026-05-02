import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('renders an accessible icon-only button', () => {
    render(<IconButton aria-label="Refresh" icon={<span aria-hidden="true">R</span>} />)

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })

  it('uses tooltip text as the accessible label when aria-label is absent', () => {
    render(<IconButton tooltip="Settings" icon={<span aria-hidden="true">S</span>} />)

    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('forces text variant and medium radius styles', () => {
    render(<IconButton aria-label="Edit" icon={<span aria-hidden="true">E</span>} />)

    const button = screen.getByRole('button', { name: 'Edit' })
    expect(button).toHaveClass('ant-btn-text')
    expect(button).toHaveStyle({ borderRadius: 'var(--radius-md)' })
  })

  it('calls onClick when activated', () => {
    const handleClick = vi.fn()
    render(
      <IconButton
        aria-label="Open"
        icon={<span aria-hidden="true">O</span>}
        onClick={handleClick}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('supports disabled state and custom classes', () => {
    const handleClick = vi.fn()
    render(
      <IconButton
        aria-label="Remove"
        className="icon-extra"
        disabled
        icon={<span aria-hidden="true">X</span>}
        onClick={handleClick}
      />
    )

    const button = screen.getByRole('button', { name: 'Remove' })
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveClass('icon-extra')
    expect(handleClick).not.toHaveBeenCalled()
  })
})

