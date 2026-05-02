import { GlassPanel } from '@/components/ui'
import styles from './ExportRecordCard.module.css'

export default function ExportRecordCard() {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <div className={styles.title}>管理导出记录</div>
      <div className={styles.placeholder} />
    </GlassPanel>
  )
}

