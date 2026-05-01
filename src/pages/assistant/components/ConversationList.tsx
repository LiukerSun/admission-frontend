import { Button } from 'antd'
import { ActionListItem, EmptyState } from '@/components/ui'
import type { AssistantConversation } from '@/services/assistant'
import styles from './ConversationList.module.css'

export type ConversationListProps = {
  title: string
  conversations: AssistantConversation[]
  activeId?: string
  onSelect: (id: string) => void
  onCreate: () => void
}

export default function ConversationList({ title, conversations, activeId, onSelect, onCreate }: ConversationListProps) {
  const list =
    conversations.length === 0 ? [{ id: 'empty', title: '暂无历史对话', updated_at: 0, messages: [] } as AssistantConversation] : conversations

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <Button type="text" size="small" onClick={onCreate}>
          新建
        </Button>
      </div>
      {list.length === 0 ? (
        <EmptyState size="sm" title="暂无历史对话" />
      ) : (
        <div className={styles.list}>
          {list.slice(0, 6).map((c) => (
            <ActionListItem
              key={c.id}
              title={c.title}
              active={c.id !== 'empty' && activeId === c.id}
              disabled={c.id === 'empty'}
              onClick={() => {
                if (c.id === 'empty') return
                onSelect(c.id)
              }}
              className={styles.item}
            />
          ))}
        </div>
      )}
    </div>
  )
}

