import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import type { AssistantConversation, AssistantMessage } from '@/services/assistant'
import { sendAssistantMessage } from '@/services/assistant'
import { GlassPanel, PageBoard } from '@/components/ui'
import { ASSISTANT_MAX_HISTORY, ASSISTANT_STORAGE_KEY, COMMON_QUESTIONS, HOT_WORDS } from '@/fixtures/assistant'
import ChatInputBar from './components/ChatInputBar'
import ChatPanel from './components/ChatPanel'
import ConversationList from './components/ConversationList'
import HotWordChips from './components/HotWordChips'
import PromptList from './components/PromptList'
import styles from './assistant.module.css'
 
let uidSeq = 0
function uid() {
  uidSeq += 1
  return `m_${uidSeq}`
}
 
function loadConversations(): AssistantConversation[] {
  const raw = localStorage.getItem(ASSISTANT_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as AssistantConversation[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((c) => c && typeof c.id === 'string' && Array.isArray(c.messages))
      .map((c) => ({
        ...c,
        title: c.title || '新对话',
        updated_at: typeof c.updated_at === 'number' ? c.updated_at : 0,
        messages: c.messages
          .filter((m) => m && typeof m.id === 'string' && (m.role === 'user' || m.role === 'assistant'))
          .map((m) => ({ ...m, created_at: typeof m.created_at === 'number' ? m.created_at : 0 })),
      }))
      .sort((a, b) => b.updated_at - a.updated_at)
  } catch {
    return []
  }
}
 
function saveConversations(list: AssistantConversation[]) {
  localStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(list.slice(0, ASSISTANT_MAX_HISTORY)))
}
 
function mockReply(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return '我可以帮你做院校/专业/省份的查询与对比。请先告诉我你的省份、科目、分数或位次。'
  if (trimmed.includes('院校') || trimmed.includes('学校')) return '你更看重地域、院校层次（985/211/双一流）还是专业优先？'
  if (trimmed.includes('专业')) return '你对专业方向有什么偏好？也可以告诉我你的兴趣与优势学科。'
  if (trimmed.includes('分数') || trimmed.includes('位次')) return '请提供省份、科目组合、分数/位次，以及意向地区，我会给出冲稳保建议。'
  return '我已收到你的问题。你可以补充：省份、科目、分数/位次、目标城市与专业偏好，我会给出更精准建议。'
}
 
export default function AssistantPage() {
  const { isAuthenticated } = useAuthStore()
  const useApi = import.meta.env.VITE_USE_ASSISTANT_API === 'true'
  const commonQuestions = useMemo(() => COMMON_QUESTIONS, [])
  const hotWords = useMemo(() => HOT_WORDS, [])
 
  const [conversations, setConversations] = useState<AssistantConversation[]>(() => loadConversations())
  const [activeId, setActiveId] = useState<string>(() => loadConversations()[0]?.id || '')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const seqRef = useRef(0)
 
  const resolvedActiveId = useMemo(() => {
    if (activeId && conversations.some((c) => c.id === activeId)) return activeId
    return conversations[0]?.id || ''
  }, [activeId, conversations])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === resolvedActiveId) || conversations[0],
    [resolvedActiveId, conversations]
  )
 
  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])
 
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [activeId, activeConversation?.messages?.length])
 
  const ensureConversation = () => {
    if (resolvedActiveId) return resolvedActiveId
    const id = uid()
    const created: AssistantConversation = { id, title: '新对话', updated_at: 0, messages: [] }
    setConversations((prev) => [created, ...prev])
    setActiveId(id)
    return id
  }
 
  const pushMessage = (conversationId: string, msg: AssistantMessage) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId)
      if (idx < 0) return prev
      const target = prev[idx]
      const nextConv: AssistantConversation = {
        ...target,
        messages: [...target.messages, msg],
        updated_at: 0,
        title:
          target.title && target.title !== '新对话'
            ? target.title
            : msg.role === 'user'
              ? msg.content.slice(0, 16)
              : target.title,
      }
      const next = [nextConv, ...prev.slice(0, idx), ...prev.slice(idx + 1)]
      return next
    })
  }
 
  const doSend = async (content: string) => {
    const text = content.trim()
    if (!text || sending) return
    setSending(true)
 
    const conversationId = ensureConversation()
    seqRef.current += 1
    const userMsg: AssistantMessage = { id: uid(), role: 'user', content: text, created_at: seqRef.current }
    pushMessage(conversationId, userMsg)
    setInput('')
 
    try {
      if (useApi && (isAuthenticated || import.meta.env.DEV)) {
        const res = await sendAssistantMessage({ message: text, conversation_id: conversationId })
        seqRef.current += 1
        const botMsg: AssistantMessage = { id: uid(), role: 'assistant', content: res.reply, created_at: seqRef.current }
        pushMessage(conversationId, botMsg)
      } else {
        seqRef.current += 1
        const botMsg: AssistantMessage = { id: uid(), role: 'assistant', content: mockReply(text), created_at: seqRef.current }
        pushMessage(conversationId, botMsg)
      }
    } catch {
      seqRef.current += 1
      const botMsg: AssistantMessage = { id: uid(), role: 'assistant', content: mockReply(text), created_at: seqRef.current }
      pushMessage(conversationId, botMsg)
    } finally {
      setSending(false)
    }
  }
 
  return (
    <div className={styles.root}>
      <PageBoard>
        <div className={styles.inner}>
          <div className={styles.leftCol}>
            <GlassPanel padding="md" className={styles.leftBlock}>
              <PromptList title="常见问题" prompts={commonQuestions} onSelect={doSend} />
            </GlassPanel>

            <GlassPanel padding="md" className={styles.leftBlock}>
              <ConversationList
                title="历史对话"
                conversations={conversations}
                activeId={resolvedActiveId}
                onSelect={(id) => setActiveId(id)}
                onCreate={() => {
                  const id = uid()
                  const created: AssistantConversation = { id, title: '新对话', updated_at: 0, messages: [] }
                  setConversations((prev) => [created, ...prev])
                  setActiveId(id)
                }}
              />
            </GlassPanel>

            <GlassPanel padding="md">
              <HotWordChips
                title="今日热词"
                words={hotWords}
                onSelect={(w) => setInput((prev) => (prev ? `${prev} ${w}` : w))}
              />
            </GlassPanel>
          </div>

          <div className={styles.rightCol}>
            <ChatPanel title="志愿填报AI助手" conversation={activeConversation} listRef={listRef} />
            <ChatInputBar value={input} sending={sending} onChange={setInput} onSend={() => doSend(input)} />
          </div>
        </div>

        <div className={styles.hint}>AI建议仅供参考</div>
      </PageBoard>
    </div>
  )
}
