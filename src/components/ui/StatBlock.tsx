import styles from './StatBlock.module.css'

export type StatBlockTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
export type StatBlockAlign = 'left' | 'center' | 'right'

export type StatBlockProps = {
  label: React.ReactNode
  value: React.ReactNode
  unit?: React.ReactNode
  tone?: StatBlockTone
  align?: StatBlockAlign
  loading?: boolean
  className?: string
}

const toneClassName: Record<StatBlockTone, string> = {
  neutral: styles.toneNeutral,
  brand: styles.toneBrand,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
}

const alignClassName: Record<StatBlockAlign, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
}

export default function StatBlock({
  label,
  value,
  unit,
  tone = 'neutral',
  align = 'center',
  loading,
  className,
}: StatBlockProps) {
  return (
    <div className={[styles.root, toneClassName[tone], alignClassName[align], className].filter(Boolean).join(' ')}>
      <div className={styles.label}>{label}</div>
      <div className={styles.valueRow}>
        {loading ? <div className={styles.skeleton} /> : <div className={styles.value}>{value}</div>}
        {unit ? <div className={styles.unit}>{unit}</div> : null}
      </div>
    </div>
  )
}

