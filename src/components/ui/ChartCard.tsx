import GlassPanel from './GlassPanel'
import SectionHeader from './SectionHeader'
import styles from './ChartCard.module.css'

export type ChartCardProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  extra?: React.ReactNode
  loading?: boolean
  empty?: boolean
  emptyTitle?: React.ReactNode
  emptyDescription?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export default function ChartCard({
  title,
  subtitle,
  extra,
  loading,
  empty,
  emptyTitle,
  emptyDescription,
  footer,
  className,
  children,
}: ChartCardProps) {
  return (
    <GlassPanel variant="solid" padding="md" className={[styles.root, className].filter(Boolean).join(' ')}>
      <SectionHeader title={title} subtitle={subtitle} actions={extra} size="md" />
      <div className={styles.body}>
        {loading ? <div className={styles.loading} /> : null}
        {!loading && empty ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>{emptyTitle || '暂无数据'}</div>
            {emptyDescription ? <div className={styles.emptyDesc}>{emptyDescription}</div> : null}
          </div>
        ) : null}
        {!loading && !empty ? <div className={styles.content}>{children}</div> : null}
      </div>
      {!loading && !empty && footer ? <div className={styles.footer}>{footer}</div> : null}
    </GlassPanel>
  )
}
