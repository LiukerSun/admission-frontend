import { GlassPanel } from '@/components/ui'
import styles from './ScoreChartCard.module.css'

export default function ScoreChartCard() {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <div className={styles.title}>分数定位图</div>
      <div className={styles.box}>
        <div className={styles.placeholderTall} />
        <div className={styles.placeholderBar} />
      </div>
    </GlassPanel>
  )
}

