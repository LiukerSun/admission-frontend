import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../Button/Button'
import { ButtonGroup } from './ButtonGroup'

describe('ButtonGroup', () => {
  it('renders children inside a group', () => {
    render(
      <ButtonGroup aria-label="Bulk actions">
        <Button>Approve</Button>
        <Button>Reject</Button>
      </ButtonGroup>
    )

    expect(screen.getByRole('group', { name: 'Bulk actions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
  })

  it('defaults to horizontal direction and medium spacing', () => {
    render(
      <ButtonGroup>
        <Button>One</Button>
      </ButtonGroup>
    )

    const group = screen.getByRole('group')
    expect(group).toHaveClass('directionHorizontal')
    expect(group).toHaveClass('spacingMd')
  })

  it('supports vertical direction and large spacing', () => {
    render(
      <ButtonGroup direction="vertical" spacing="lg">
        <Button>One</Button>
      </ButtonGroup>
    )

    const group = screen.getByRole('group')
    expect(group).toHaveClass('directionVertical')
    expect(group).toHaveClass('spacingLg')
  })

  it('merges custom className and style', () => {
    render(
      <ButtonGroup className="custom-group" style={{ marginTop: 8 }}>
        <Button>Styled</Button>
      </ButtonGroup>
    )

    const group = screen.getByRole('group')
    expect(group).toHaveClass('custom-group')
    expect(group).toHaveStyle({ marginTop: '8px' })
  })

  it('supports small spacing', () => {
    render(
      <ButtonGroup spacing="sm">
        <Button>Small</Button>
      </ButtonGroup>
    )

    expect(screen.getByRole('group')).toHaveClass('spacingSm')
  })
})
