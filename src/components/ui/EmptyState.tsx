import styles from './EmptyState.module.css'

export type EmptyStateSize = 'sm' | 'md'

export type EmptyStateProps = {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  size?: EmptyStateSize
  className?: string
}

const sizeClassName: Record<EmptyStateSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
}

export default function EmptyState({ title, description, actions, size = 'md', className }: EmptyStateProps) {
  return (
    <div className={[styles.root, sizeClassName[size], className].filter(Boolean).join(' ')}>
      <div className={styles.title}>{title}</div>
      {description ? <div className={styles.desc}>{description}</div> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  )
}

