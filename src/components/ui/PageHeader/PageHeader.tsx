import type { CSSProperties, ReactNode } from 'react'
import { RADIUS_MAP } from '../_shared/types'
import type { RadiusToken, Tone } from '../_shared/types'
import { cn } from '../_shared/utils'
import styles from './PageHeader.module.css'

export type PageHeaderCollapseBreakpoint = 'sm' | 'md' | 'lg'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  tone?: Tone
  bottomRadius?: RadiusToken
  collapseBreakpoint?: PageHeaderCollapseBreakpoint
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

const collapseClassName: Record<PageHeaderCollapseBreakpoint, string> = {
  sm: styles.collapseSm,
  md: styles.collapseMd,
  lg: styles.collapseLg,
}

export function PageHeader({
  actions,
  bottomRadius = 'md',
  className,
  collapseBreakpoint = 'md',
  style,
  subtitle,
  title,
  tone = 'brand',
}: PageHeaderProps) {
  return (
    <div
      className={cn(styles.root, toneClassName[tone], collapseClassName[collapseBreakpoint], className)}
      style={{
        ...style,
        borderBottomLeftRadius: RADIUS_MAP[bottomRadius],
        borderBottomRightRadius: RADIUS_MAP[bottomRadius],
      }}
    >
      <div className={styles.content}>
        <div className={styles.titles}>
          <div className={styles.title}>{title}</div>
          {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </div>
  )
}

export default PageHeader
