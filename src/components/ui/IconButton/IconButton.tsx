import { Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { Button } from '../Button/Button'
import type { ButtonProps } from '../Button/Button'
import { cn } from '../_shared/utils'
import styles from './IconButton.module.css'

type IconButtonBaseProps = Omit<ButtonProps, 'children' | 'radius' | 'variant'>

type IconButtonAccessibleName =
  | {
      'aria-label': string
      tooltip?: ReactNode
    }
  | {
      'aria-label'?: undefined
      tooltip: string
    }

export type IconButtonProps = IconButtonBaseProps &
  IconButtonAccessibleName & {
  /** Icon rendered as the button content. */
  icon: ReactNode
  /** Optional hover label. String tooltips are reused as the accessible label. */
  tooltip?: ReactNode
}

export function IconButton({
  'aria-label': ariaLabel,
  className,
  icon,
  tooltip,
  ...buttonProps
}: IconButtonProps) {
  const resolvedAriaLabel = ariaLabel ?? (typeof tooltip === 'string' ? tooltip : undefined)

  const button = (
    <Button
      {...buttonProps}
      aria-label={resolvedAriaLabel}
      className={cn(styles.root, className)}
      icon={icon}
      radius="md"
      variant="text"
    />
  )

  if (!tooltip) {
    return button
  }

  return <Tooltip title={tooltip}>{button}</Tooltip>
}

export default IconButton
