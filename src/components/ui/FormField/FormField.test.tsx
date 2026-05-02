import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './FormField'

describe('FormField', () => {
  it('associates label and control via htmlFor', () => {
    render(
      <FormField htmlFor="phone" label="手机号">
        <input id="phone" />
      </FormField>
    )

    expect(screen.getByLabelText('手机号')).toHaveAttribute('id', 'phone')
  })

  it('renders required marker when required', () => {
    const { container } = render(
      <FormField htmlFor="email" label="邮箱" required>
        <input id="email" />
      </FormField>
    )

    expect(container.querySelector('[data-slot="required"]')).toBeInTheDocument()
  })

  it('renders help text when provided', () => {
    render(
      <FormField helpText="仅用于通知" htmlFor="email" label="邮箱">
        <input id="email" />
      </FormField>
    )

    expect(screen.getByText('仅用于通知')).toBeInTheDocument()
  })

  it('renders error text as an alert', () => {
    render(
      <FormField error="必填项" htmlFor="email" label="邮箱">
        <input id="email" />
      </FormField>
    )

    expect(screen.getByRole('alert')).toHaveTextContent('必填项')
  })

  it('supports horizontal layout class', () => {
    const { container } = render(
      <FormField htmlFor="email" label="邮箱" layout="horizontal">
        <input id="email" />
      </FormField>
    )

    expect(container.firstChild).toHaveClass('layoutHorizontal')
  })

  it('keeps label accessible when visually hidden', () => {
    render(
      <FormField hiddenLabel htmlFor="email" label="邮箱">
        <input id="email" />
      </FormField>
    )

    const labelText = screen.getByText('邮箱')
    expect(labelText.closest('label')).toHaveClass('visuallyHidden')
    expect(screen.getByLabelText('邮箱')).toHaveAttribute('id', 'email')
  })

  it('merges className and style', () => {
    const { container } = render(
      <FormField className="extra-class" label="邮箱" style={{ marginTop: 12 }}>
        <input id="email" />
      </FormField>
    )

    const root = container.firstChild as HTMLElement
    expect(root).toHaveClass('extra-class')
    expect(root).toHaveStyle({ marginTop: '12px' })
  })
})
