import { GlassPanel, StatBlock } from '@/components/ui'
import styles from './RiskStatGroup.module.css'

export type RiskCounts = {
  rush: number
  steady: number
  safe: number
}

export default function RiskStatGroup({ counts }: { counts: RiskCounts }) {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <StatBlock label="冲一冲" value={counts.rush} unit="所院校" />
      <StatBlock label="稳一稳" value={counts.steady} unit="所院校" />
      <StatBlock label="保一保" value={counts.safe} unit="所院校" />
    </GlassPanel>
  )
}

