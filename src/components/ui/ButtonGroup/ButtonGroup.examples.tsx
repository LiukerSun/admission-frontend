import { Button } from '../Button/Button'
import { ButtonGroup } from './ButtonGroup'

/**
 * ButtonGroup examples
 *
 * Shows horizontal and vertical action clusters with token-backed spacing.
 */
export function ButtonGroupExamples() {
  return (
    <div>
      <ButtonGroup aria-label="Primary actions">
        <Button>通过</Button>
        <Button variant="secondary">复核</Button>
        <Button tone="danger" variant="ghost">
          驳回
        </Button>
      </ButtonGroup>

      <ButtonGroup aria-label="Stacked actions" direction="vertical" spacing="lg">
        <Button>继续</Button>
        <Button variant="text">跳过</Button>
      </ButtonGroup>
    </div>
  )
}
