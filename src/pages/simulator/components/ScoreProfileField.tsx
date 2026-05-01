import styles from './ScoreProfileField.module.css'

export type ScoreProfileFieldProps = {
  label: React.ReactNode
  control: React.ReactNode
  suffix?: React.ReactNode
}

export default function ScoreProfileField({ label, control, suffix }: ScoreProfileFieldProps) {
  return (
    <div className={styles.root}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {control}
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
      </span>
    </div>
  )
}

