import { GlassPanel, SectionHeader } from '@/components/ui'
import styles from './RecommendationList.module.css'

export default function RecommendationList() {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <SectionHeader title="智能推荐院校（较稳方案）" size="md" />
      <div className={styles.list}>
        <div className={styles.item} />
        <div className={styles.item} />
        <div className={styles.item} />
      </div>
    </GlassPanel>
  )
}

