import styles from './SectionHeader.module.css'

export type SectionHeaderSize = 'md' | 'lg'

export type SectionHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  size?: SectionHeaderSize
  className?: string
}

const sizeClassName: Record<SectionHeaderSize, string> = {
  md: styles.sizeMd,
  lg: styles.sizeLg,
}

export default function SectionHeader({ title, subtitle, actions, size = 'md', className }: SectionHeaderProps) {
  return (
    <div className={[styles.root, sizeClassName[size], className].filter(Boolean).join(' ')}>
      <div className={styles.left}>
        <div className={styles.title}>{title}</div>
        {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  )
}

