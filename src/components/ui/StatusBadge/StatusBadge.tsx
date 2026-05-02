import type { CSSProperties, ReactNode } from 'react'
import type { Tone } from '../_shared/types'
import { cn } from '../_shared/utils'
import styles from './StatusBadge.module.css'

export type StatusBadgeVariant = 'dot' | 'text' | 'filled'
export type StatusBadgeSize = 'sm' | 'md'

export interface StatusBadgeProps {
  label: ReactNode
  variant?: StatusBadgeVariant
  tone?: Tone
  pulse?: boolean
  size?: StatusBadgeSize
  className?: string
  style?: CSSProperties
}

const toneClassName: Record<Tone, string> = {
  brand: styles.toneBrand,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  default: styles.toneDefault,
}

const variantClassName: Record<StatusBadgeVariant, string> = {
  dot: styles.variantDot,
  text: styles.variantText,
  filled: styles.variantFilled,
}

const sizeClassName: Record<StatusBadgeSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
}

export function StatusBadge({
  className,
  label,
  pulse = false,
  size = 'md',
  style,
  tone = 'default',
  variant = 'text',
}: StatusBadgeProps) {
  const showDot = variant === 'dot'

  return (
    <span
      className={cn(styles.root, toneClassName[tone], sizeClassName[size], variantClassName[variant], className)}
      style={style}
    >
      {showDot ? <span aria-hidden="true" className={cn(styles.dot, pulse && styles.pulse)} data-slot="dot" /> : null}
      <span className={styles.label} data-slot="label">
        {label}
      </span>
    </span>
  )
}

export default StatusBadge
