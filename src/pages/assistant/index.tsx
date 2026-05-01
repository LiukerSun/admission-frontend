import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input } from 'antd'
import { ArrowUpOutlined, SearchOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import type { AssistantConversation, AssistantMessage } from '@/services/assistant'
import { sendAssistantMessage } from '@/services/assistant'
import './assistant.css'
 
const STORAGE_KEY = 'assistant_conversations'
const MAX_HISTORY = 12
 
let uidSeq = 0
function uid() {
  uidSeq += 1
  return `m_${uidSeq}`
}
 
function loadConversations(): AssistantConversation[] {
  const raw = localStorage.getItem(STORAGE_KEY)
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)))
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
 
  const commonQuestions = useMemo(
    () => [
      '我在本省排名 2 万左右，适合报哪些学校？',
      '计算机类专业有哪些细分方向，怎么选？',
      '冲稳保怎么分配比例更合理？',
      '同一所学校不同专业分数差距大吗？',
    ],
    []
  )
 
  const hotWords = useMemo(() => ['985', '211', '双一流', '位次换算', '分数线趋势'], [])
 
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
    <div className="aiPageRoot">
      <div className="aiBoard">
        <div className="aiBoardInner">
          <div className="leftCol">
            <div className="glassPanel leftBlock">
              <div className="leftTitle">常见问题</div>
              <div className="leftItemList">
                {commonQuestions.map((q) => (
                  <div
                    key={q}
                    className="leftPill leftPillClickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => doSend(q)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') doSend(q)
                    }}
                    title={q}
                  >
                    <div className="leftPillText">{q}</div>
                  </div>
                ))}
              </div>
            </div>
 
            <div className="glassPanel leftBlock">
              <div className="leftTitleRow">
                <div className="leftTitle" style={{ marginBottom: 0 }}>
                  历史对话
                </div>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    const id = uid()
                    const created: AssistantConversation = { id, title: '新对话', updated_at: 0, messages: [] }
                    setConversations((prev) => [created, ...prev])
                    setActiveId(id)
                  }}
                >
                  新建
                </Button>
              </div>
              <div className="leftItemList">
                {(conversations.length === 0 ? [{ id: 'empty', title: '暂无历史对话', updated_at: 0, messages: [] }] : conversations).slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className={[
                      'leftPill',
                      'leftPillClickable',
                      c.id !== 'empty' && resolvedActiveId === c.id ? 'leftPillActive' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (c.id === 'empty') return
                      setActiveId(c.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && c.id !== 'empty') setActiveId(c.id)
                    }}
                    title={c.title}
                  >
                    <div className="leftPillText">{c.title}</div>
                  </div>
                ))}
              </div>
            </div>
 
            <div className="glassPanel hotBlock">
              <div className="hotTitle">今日热词</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="hotWords">
                  {hotWords.map((w) => (
                    <button
                      key={w}
                      className="hotWord"
                      type="button"
                      onClick={() => setInput((prev) => (prev ? `${prev} ${w}` : w))}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
 
          <div className="rightCol">
            <div className="glassPanel chatPanel">
              <div className="chatHeader">
                <div className="chatHeaderTitle">志愿填报AI助手</div>
                <div className="chatHeaderAvatars">
                  <div className="avatarDot" />
                  <div className="avatarDot" style={{ background: 'rgba(176, 247, 234, 0.55)' }} />
                </div>
              </div>
              <div className="chatBody" ref={listRef}>
                <div className="chatMessages">
                  {(activeConversation?.messages?.length ? activeConversation.messages : []).map((m) => (
                    <div key={m.id} className={['chatRow', m.role === 'user' ? 'chatRowUser' : 'chatRowBot'].join(' ')}>
                      <div className={['chatBubble', m.role === 'user' ? 'chatBubbleUser' : 'chatBubbleBot'].join(' ')}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {activeConversation?.messages?.length ? null : (
                    <div className="chatEmpty">
                      <div className="chatEmptyTitle">你可以从左侧常见问题开始</div>
                      <div className="chatEmptySub">也可以直接输入省份、科目、分数/位次和目标专业</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
 
            <div className="glassPanel chatInputBar">
              <Input
                allowClear
                value={input}
                onChange={(e) => setInput(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="输入您的问题..."
                disabled={sending}
                onPressEnter={() => doSend(input)}
              />
              <Button className="sendBtn" icon={<ArrowUpOutlined />} loading={sending} onClick={() => doSend(input)} />
            </div>
          </div>
        </div>
 
        <div className="aiHint">AI建议仅供参考</div>
      </div>
    </div>
  )
}
