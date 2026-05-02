import { GlassPanel } from '@/components/ui'
import type { AssistantConversation } from '@/services/assistant'
import MessageBubble from './MessageBubble'
import styles from './ChatPanel.module.css'

export type ChatPanelProps = {
  title: string
  conversation?: AssistantConversation
  listRef?: React.RefObject<HTMLDivElement | null>
}

export default function ChatPanel({ title, conversation, listRef }: ChatPanelProps) {
  const messages = conversation?.messages || []

  return (
    <GlassPanel padding="md" className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>{title}</div>
        <div className={styles.avatars}>
          <div className={styles.avatarDot} />
          <div className={styles.avatarDot} style={{ background: 'rgba(176, 247, 234, 0.55)' }} />
        </div>
      </div>
      <div className={styles.body} ref={listRef}>
        <div className={styles.messages}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>你可以从左侧常见问题开始</div>
              <div className={styles.emptySub}>也可以直接输入省份、科目、分数/位次和目标专业</div>
            </div>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  )
}

