import type { CSSProperties, ReactNode } from 'react'

export type ComponentSize = 'sm' | 'md' | 'lg'
export type Variant = 'primary' | 'secondary' | 'ghost'
export type Tone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'default'
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'

export const RADIUS_MAP: Record<RadiusToken, string> = {
  none: '0',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  pill: 'var(--radius-pill)',
}

export interface BaseComponentProps {
  className?: string
  style?: CSSProperties
  size?: ComponentSize
  variant?: Variant
  tone?: Tone
  disabled?: boolean
  loading?: boolean
  children?: ReactNode
}

