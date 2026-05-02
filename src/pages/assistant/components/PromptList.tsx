import { ActionListItem, EmptyState } from '@/components/ui'
import styles from './PromptList.module.css'

export type PromptListProps = {
  title: string
  prompts: string[]
  onSelect: (prompt: string) => void
}

export default function PromptList({ title, prompts, onSelect }: PromptListProps) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>
      {prompts.length === 0 ? (
        <EmptyState size="sm" title="暂无内容" />
      ) : (
        <div className={styles.list}>
          {prompts.map((q) => (
            <ActionListItem key={q} title={q} onClick={() => onSelect(q)} className={styles.item} />
          ))}
        </div>
      )}
    </div>
  )
}

