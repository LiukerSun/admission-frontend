import type { AssistantMessage } from '@/services/assistant'
import styles from './MessageBubble.module.css'

export default function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={[styles.row, isUser ? styles.rowUser : styles.rowBot].join(' ')}>
      <div className={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot].join(' ')}>{message.content}</div>
    </div>
  )
}

