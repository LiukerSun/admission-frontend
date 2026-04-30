import type React from 'react'
import { Button } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  InboxOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import './soft-ui.css'

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate'

const TONE_COLORS: Record<Tone, string> = {
  blue: 'var(--color-primary)',
  green: 'var(--color-success)',
  amber: 'var(--color-warning)',
  red: 'var(--color-danger)',
  slate: 'var(--color-text-muted)',
}

export interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="softPageHeader">
      <div className="softPageHeaderMain">
        {eyebrow && <div className="softEyebrow">{eyebrow}</div>}
        <h1 className="softPageTitle">{title}</h1>
        {description && <div className="softPageDescription">{description}</div>}
      </div>
      {actions && <div className="softPageHeaderActions">{actions}</div>}
    </header>
  )
}

export interface MetricCardProps {
  title: React.ReactNode
  value: React.ReactNode
  icon?: React.ReactNode
  tone?: Tone
  trend?: number
  trendLabel?: React.ReactNode
  children?: React.ReactNode
}

export function MetricCard({
  title,
  value,
  icon,
  tone = 'blue',
  trend,
  trendLabel,
  children,
}: MetricCardProps) {
  const color = TONE_COLORS[tone]
  const trendIcon = trend === undefined ? <MinusOutlined /> : trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />

  return (
    <section className="softMetricCard" style={{ '--metric-color': color } as React.CSSProperties}>
      <div className="softMetricTop">
        <div>
          <div className="softMetricTitle">{title}</div>
          <div className="softMetricValue">{value}</div>
        </div>
        {icon && <div className="softMetricIcon">{icon}</div>}
      </div>
      {(trend !== undefined || trendLabel || children) && (
        <div className="softMetricFooter">
          {trend !== undefined ? (
            <span className="softMetricTrend">
              {trendIcon}
              {Math.abs(trend)}%
            </span>
          ) : (
            <span />
          )}
          <span>{trendLabel}</span>
        </div>
      )}
      {children}
    </section>
  )
}

export interface DataPanelProps {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  compact?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DataPanel({ title, description, actions, compact = false, children, className, style }: DataPanelProps) {
  return (
    <section className={['softDataPanel', className].filter(Boolean).join(' ')} style={style}>
      {(title || description || actions) && (
        <div className="softDataPanelHeader">
          <div>
            {title && <h2 className="softDataPanelTitle">{title}</h2>}
            {description && <div className="softDataPanelDescription">{description}</div>}
          </div>
          {actions && <div className="softPageHeaderActions">{actions}</div>}
        </div>
      )}
      <div className={compact ? 'softDataPanelBody softDataPanelBodyCompact' : 'softDataPanelBody'}>
        {children}
      </div>
    </section>
  )
}

export interface ActionToolbarProps {
  children: React.ReactNode
  extra?: React.ReactNode
}

export function ActionToolbar({ children, extra }: ActionToolbarProps) {
  return (
    <div className="softActionToolbar">
      <div className="softActionToolbarMain">{children}</div>
      {extra && <div className="softActionToolbarExtra">{extra}</div>}
    </div>
  )
}

export interface StatusItem {
  label: React.ReactNode
  color?: string
  tone?: Tone
}

export function StatusStack({ items, compact = false }: { items: StatusItem[]; compact?: boolean }) {
  return (
    <div className={compact ? 'softStatusStack softStatusStackCompact' : 'softStatusStack'}>
      {items.map((item, index) => (
        <span
          key={index}
          className="softStatusPill"
          style={{ '--status-color': item.color ?? TONE_COLORS[item.tone ?? 'slate'] } as React.CSSProperties}
        >
          {item.label}
        </span>
      ))}
    </div>
  )
}

export interface SmartEmptyStateProps {
  title: React.ReactNode
  description?: React.ReactNode
  actionText?: React.ReactNode
  onAction?: () => void
  icon?: React.ReactNode
}

export function SmartEmptyState({ title, description, actionText, onAction, icon }: SmartEmptyStateProps) {
  return (
    <div className="softEmptyState">
      <div className="softEmptyIcon">{icon ?? <InboxOutlined />}</div>
      <h2 className="softEmptyTitle">{title}</h2>
      {description && <div className="softEmptyDescription">{description}</div>}
      {actionText && (
        <div className="softEmptyAction">
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  )
}
