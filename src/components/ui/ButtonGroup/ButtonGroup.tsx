import type { HTMLAttributes } from 'react'
import { cn } from '../_shared/utils'
import styles from './ButtonGroup.module.css'

export type ButtonGroupDirection = 'horizontal' | 'vertical'
export type ButtonGroupSpacing = 'sm' | 'md' | 'lg'

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  direction?: ButtonGroupDirection
  spacing?: ButtonGroupSpacing
}

const directionClassName: Record<ButtonGroupDirection, string> = {
  horizontal: styles.directionHorizontal,
  vertical: styles.directionVertical,
}

const spacingClassName: Record<ButtonGroupSpacing, string> = {
  sm: styles.spacingSm,
  md: styles.spacingMd,
  lg: styles.spacingLg,
}

export function ButtonGroup({
  children,
  className,
  direction = 'horizontal',
  role = 'group',
  spacing = 'md',
  ...groupProps
}: ButtonGroupProps) {
  return (
    <div
      {...groupProps}
      className={cn(styles.root, directionClassName[direction], spacingClassName[spacing], className)}
      role={role}
    >
      {children}
    </div>
  )
}

export default ButtonGroup

