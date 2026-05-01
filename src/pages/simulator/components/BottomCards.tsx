import { GlassPanel, SectionHeader } from '@/components/ui'
import styles from './BottomCards.module.css'

export default function BottomCards() {
  return (
    <div className={styles.root}>
      <GlassPanel padding="md">
        <SectionHeader title="AI建议" size="md" />
        <div className={styles.placeholder} />
      </GlassPanel>
      <GlassPanel padding="md">
        <SectionHeader title="方案状态" size="md" />
        <div className={styles.placeholder} />
      </GlassPanel>
    </div>
  )
}

