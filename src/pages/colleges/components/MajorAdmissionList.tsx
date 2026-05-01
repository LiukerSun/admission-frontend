import { ActionListItem, EmptyState, GlassPanel, SectionHeader } from '@/components/ui'
import type { PlanExt } from '@/fixtures/colleges'
import styles from './MajorAdmissionList.module.css'

export type MajorAdmissionListProps = {
  title: string
  plans: PlanExt[]
  limit?: number
}

export default function MajorAdmissionList({ title, plans, limit = 5 }: MajorAdmissionListProps) {
  return (
    <GlassPanel variant="solid" padding="md" className={styles.root}>
      <SectionHeader title={title} size="md" />
      {plans.length === 0 ? (
        <EmptyState size="sm" title="暂无数据" />
      ) : (
        <div className={styles.list}>
          {plans.slice(0, limit).map((p, idx) => (
            <ActionListItem
              key={`${p.school_code || ''}-${p.major_name || ''}-${idx}`}
              title={p.major_name || '专业'}
              meta={`${p.province || '-'} · ${p.year || '-'} · ${p.batch || '-'}`}
              right={
                <div className={styles.right}>
                  <div>计划：{p.plan_count ?? '-'}</div>
                  <div>
                    分数：{p.min_score ?? '-'} ~ {p.max_score ?? '-'}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}
    </GlassPanel>
  )
}

