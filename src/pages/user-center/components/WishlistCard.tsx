import { GlassPanel } from '@/components/ui'
import { ActionListItem, EmptyState, SectionHeader } from '@/components/ui'
import styles from './WishlistCard.module.css'

export type WishlistCardProps = {
  items: string[]
  onView: (schoolName: string) => void
}

export default function WishlistCard({ items, onView }: WishlistCardProps) {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <SectionHeader title="收藏院校" size="md" className={styles.header} />
      {items.length === 0 ? (
        <EmptyState size="sm" title="暂无收藏" />
      ) : (
        <div className={styles.list}>
          {items.map((s) => (
            <ActionListItem key={s} title={s} right="查看" onClick={() => onView(s)} />
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

