import styles from './ActionListItem.module.css'

export type ActionListItemProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
  right?: React.ReactNode
  actions?: React.ReactNode
  active?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export default function ActionListItem({
  title,
  subtitle,
  meta,
  right,
  actions,
  active,
  disabled,
  className,
  onClick,
}: ActionListItemProps) {
  const clickable = Boolean(onClick) && !disabled

  return (
    <button
      type="button"
      className={[
        styles.root,
        clickable ? styles.clickable : '',
        active ? styles.active : '',
        disabled ? styles.disabled : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      <div className={styles.main}>
        <div className={styles.title}>{title}</div>
        {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        {meta ? <div className={styles.meta}>{meta}</div> : null}
      </div>
      {right ? <div className={styles.right}>{right}</div> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </button>
  )
}

