import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar, Button, Empty, Layout, Spin, Tag, Typography, message, theme } from 'antd'
import type { AxiosError } from 'axios'
import {
  BulbOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  PlusOutlined,
  RedoOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Bubble, Sender, Welcome } from '@ant-design/x'
import type { BubbleItemType } from '@ant-design/x/es/bubble'
import { conversationApi, type Conversation, type Message } from '@/services/conversation'
import { streamChatWithConversation, streamRegenerateWithConversation, type SSEEvent } from '@/services/ai'
import { useAuthStore } from '@/stores/authStore'
import { usePaywallStore } from '@/stores/paywallStore'
import MessageEditor from '@/components/ai-chat/MessageEditor'
import SegmentRenderer from '@/components/ai-chat/SegmentRenderer'
import SuggestionPills from '@/components/ai-chat/SuggestionPills'
import type { ChatStatus, Segment, ToolCallStatus } from '@/components/ai-chat/types'

const { Sider, Content } = Layout
const { Text } = Typography

interface ChatItem extends BubbleItemType {
  role: 'user' | 'ai' | 'system'
  key: string | number
  content: string
  segments: Segment[]
  chatStatus: ChatStatus
  toolCallStatus?: ToolCallStatus
  serverId?: number
}

export default function AdmissionAIPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const conversationIdParam = searchParams.get('id')
  const conversationId = conversationIdParam ? Number(conversationIdParam) : null

  const { token } = theme.useToken()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [suggestionsByConversation, setSuggestionsByConversation] = useState<Record<number, string[]>>({})
  const suggestions = useMemo(() => {
    if (!conversationId) return []
    return suggestionsByConversation[conversationId] || []
  }, [conversationId, suggestionsByConversation])
  const [editingKey, setEditingKey] = useState<string | number | null>(null)
  const [editingSaving, setEditingSaving] = useState(false)
  const abortRef = useRef<(() => void) | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const pendingBufferRef = useRef('')
  const rafRef = useRef<number | null>(null)
  const lastFlushRef = useRef(0)
  const activeAIKeyRef = useRef<string | number | null>(null)
  const suggestionsTimerRef = useRef<number | null>(null)
  const syncTimerRef = useRef<number | null>(null)
  const pendingDraftRef = useRef<string | null>(null)

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true)
    try {
      const res = await conversationApi.list()
      setConversations(res.data?.data || [])
    } catch {
      // Silently failing here means the sidebar just stays empty with
      // no signal — users hit "新建对话" thinking they have no chats
      // when really their existing ones just didn't load. A toast tells
      // them to retry.
      message.error('加载对话列表失败，请稍后重试')
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (id: number): Promise<ChatItem[]> => {
    const res = await conversationApi.get(id)
    const data = res.data?.data
    return (data?.messages ?? []).map((m: Message) => {
      const role = m.role === 'user' ? 'user' : 'ai'
      const segments: Segment[] = [{ type: 'text', content: m.content || '' }]
      if (Array.isArray(m.widgets)) {
        m.widgets.forEach((w) => {
          if (w && typeof w.id === 'string' && (w.kind === 'chart' || w.kind === 'card') && w.payload) {
            segments.push({ type: 'widget', id: w.id, kind: w.kind, payload: w.payload })
          }
        })
      }
      return {
        key: m.id,
        serverId: m.id,
        role,
        content: m.content || '',
        segments,
        chatStatus: 'done',
        status: 'success',
        placement: role === 'user' ? 'end' : 'start',
      }
    })
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadConversations)
  }, [loadConversations])

  useEffect(() => {
    // Cancel any in-flight stream from the previously selected
    // conversation. Without this, switching conversations leaves the
    // old EventSource alive and its callbacks keep firing setState on
    // an aiMessageKey that no longer exists in the new conversation's
    // messages array — so partial deltas leak into the new chat or
    // silently get appended to a deleted message.
    abortRef.current?.()
    abortRef.current = null
    activeAIKeyRef.current = null
    pendingBufferRef.current = ''
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (suggestionsTimerRef.current) {
      window.clearTimeout(suggestionsTimerRef.current)
      suggestionsTimerRef.current = null
    }
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current)
      syncTimerRef.current = null
    }

    let ignore = false

    void Promise.resolve().then(async () => {
      if (ignore) return

      setLoading(false)
      const pendingDraft = pendingDraftRef.current
      setInputValue(pendingDraft || '')
      pendingDraftRef.current = null
      setMessages([])
      setEditingKey(null)

      if (!conversationId) return

      try {
        const items = await loadMessages(conversationId)
        if (!ignore) {
          setMessages(items)
        }
      } catch (err) {
        if (ignore) return

        const axiosErr = err as AxiosError
        setMessages([])
        if (axiosErr.response?.status === 404) {
          navigate('/admission/ai', { replace: true })
        } else {
          message.error('加载对话内容失败，请稍后重试')
        }
      }
    })

    return () => {
      ignore = true
      // On unmount (and on every conversation switch — same callback)
      // tear down any open stream. Otherwise navigating away from the
      // page mid-stream keeps the network request open and React tries
      // to setState on an unmounted component.
      abortRef.current?.()
      abortRef.current = null
      activeAIKeyRef.current = null
      pendingBufferRef.current = ''
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (suggestionsTimerRef.current) {
        window.clearTimeout(suggestionsTimerRef.current)
        suggestionsTimerRef.current = null
      }
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }
    }
  }, [conversationId, loadMessages, navigate])

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }

  const lastAIKey = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'ai') return messages[i].key
    }
    return null
  }, [messages])

  const lastUserKey = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].key
    }
    return null
  }, [messages])

  const flushPending = useCallback((force?: boolean) => {
    const now = Date.now()
    if (!force && now - lastFlushRef.current < 50) return
    if (!pendingBufferRef.current) return
    const aiKey = activeAIKeyRef.current
    if (!aiKey) return

    const delta = pendingBufferRef.current
    pendingBufferRef.current = ''
    lastFlushRef.current = now

    setMessages((prev) =>
      prev.map((m) => {
        if (m.key !== aiKey) return m
        const nextSegments = m.segments.length ? [...m.segments] : []
        const last = nextSegments[nextSegments.length - 1]
        if (last && last.type === 'text') {
          nextSegments[nextSegments.length - 1] = { type: 'text', content: (last.content || '') + delta }
        } else {
          nextSegments.push({ type: 'text', content: delta })
        }
        const text = nextSegments
          .filter((s) => s.type === 'text')
          .map((s) => s.content)
          .join('')
        return { ...m, segments: nextSegments, content: text, loading: false, chatStatus: 'streaming', status: 'loading' }
      })
    )
    setTimeout(scrollToBottom, 50)
  }, [])

  const scheduleFlush = useCallback(() => {
    if (rafRef.current) return
    const tick = () => {
      rafRef.current = null
      flushPending(false)
      if (pendingBufferRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [flushPending])

  const fetchSuggestions = useCallback(
    async (convId: number) => {
      try {
        const res = await conversationApi.suggestions(convId)
        const next = res.data?.data?.suggestions
        if (Array.isArray(next)) {
          setSuggestionsByConversation((prev) => ({
            ...prev,
            [convId]: next.filter((s): s is string => typeof s === 'string').slice(0, 4),
          }))
        } else {
          setSuggestionsByConversation((prev) => ({ ...prev, [convId]: [] }))
        }
      } catch {
        setSuggestionsByConversation((prev) => ({ ...prev, [convId]: [] }))
      }
    },
    []
  )

  const syncConversation = useCallback(
    async (convId: number) => {
      try {
        const items = await loadMessages(convId)
        setMessages(items)
      } catch {
        // ignore
      }
    },
    [loadMessages]
  )

  const onStreamEvent = useCallback(
    (convId: number, aiKey: string | number, event: SSEEvent) => {
      if (event.type === 'text_delta') {
        pendingBufferRef.current += event.content || ''
        if (!lastFlushRef.current) {
          flushPending(true)
        } else {
          scheduleFlush()
        }
        return
      }

      if (event.type === 'widget') {
        flushPending(true)
        setMessages((prev) =>
          prev.map((m) =>
            m.key === aiKey
              ? {
                  ...m,
                  segments: [...m.segments, { type: 'widget', id: event.id, kind: event.kind, payload: event.payload }],
                  loading: false,
                }
              : m
          )
        )
        setTimeout(scrollToBottom, 50)
        return
      }

      if (event.type === 'tool_call_start') {
        setMessages((prev) =>
          prev.map((m) =>
            m.key === aiKey ? { ...m, toolCallStatus: { toolName: event.tool_name, callId: event.call_id } } : m
          )
        )
        return
      }

      if (event.type === 'tool_call_end') {
        setMessages((prev) => prev.map((m) => (m.key === aiKey ? { ...m, toolCallStatus: undefined } : m)))
        return
      }

      if (event.type === 'done') {
        flushPending(true)
        setLoading(false)
        setMessages((prev) =>
          prev.map((m) =>
            m.key === aiKey ? { ...m, loading: false, chatStatus: 'done', status: 'success', toolCallStatus: undefined } : m
          )
        )
        if (suggestionsTimerRef.current) window.clearTimeout(suggestionsTimerRef.current)
        suggestionsTimerRef.current = window.setTimeout(() => {
          void fetchSuggestions(convId)
        }, 500)
        if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
        syncTimerRef.current = window.setTimeout(() => {
          void syncConversation(convId)
        }, 300)
        return
      }

      if (event.type === 'error') {
        flushPending(true)
        setLoading(false)
        setMessages((prev) =>
          prev.map((m) => {
            if (m.key !== aiKey) return m
            const text = m.content || event.content || '抱歉，发生了错误，请重试。'
            const segments: Segment[] = text ? [{ type: 'text', content: text }] : []
            return { ...m, content: text, segments, loading: false, chatStatus: 'error', status: 'error', toolCallStatus: undefined }
          })
        )
        if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
        syncTimerRef.current = window.setTimeout(() => {
          void syncConversation(convId)
        }, 300)
        return
      }
    },
    [fetchSuggestions, flushPending, scheduleFlush, syncConversation]
  )

  const startChatStream = useCallback(
    (convId: number, userText: string, aiKey: string | number) => {
      abortRef.current?.()
      pendingBufferRef.current = ''
      lastFlushRef.current = 0
      activeAIKeyRef.current = aiKey

      abortRef.current = streamChatWithConversation(
        convId,
        userText,
        (event) => onStreamEvent(convId, aiKey, event),
        (err) => {
          setLoading(false)
          setMessages((prev) =>
            prev.map((m) =>
              m.key === aiKey
                ? {
                    ...m,
                    content: m.content || `错误: ${err.message}`,
                    segments: [{ type: 'text', content: m.content || `错误: ${err.message}` }],
                    loading: false,
                  chatStatus: 'error',
                  status: 'error',
                    toolCallStatus: undefined,
                  }
                : m
            )
          )
        }
      )
    },
    [onStreamEvent]
  )

  const startRegenerateStream = useCallback(
    (convId: number, aiKey: string | number) => {
      abortRef.current?.()
      pendingBufferRef.current = ''
      lastFlushRef.current = 0
      activeAIKeyRef.current = aiKey

      abortRef.current = streamRegenerateWithConversation(
        convId,
        (event) => onStreamEvent(convId, aiKey, event),
        (err) => {
          setLoading(false)
          setMessages((prev) =>
            prev.map((m) =>
              m.key === aiKey
                ? {
                    ...m,
                    content: m.content || `错误: ${err.message}`,
                    segments: [{ type: 'text', content: m.content || `错误: ${err.message}` }],
                    loading: false,
                  chatStatus: 'error',
                  status: 'error',
                    toolCallStatus: undefined,
                  }
                : m
            )
          )
        }
      )
    },
    [onStreamEvent]
  )

  const handleCreateConversation = async () => {
    try {
      const res = await conversationApi.create('新对话')
      const conv = res.data?.data
      if (conv) {
        setConversations((prev) => [conv, ...prev])
        navigate(`/admission/ai?id=${conv.id}`)
      }
    } catch {
      message.error('创建对话失败，请稍后重试')
    }
  }

  const handleSelectConversation = (id: number) => {
    navigate(`/admission/ai?id=${id}`)
  }

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await conversationApi.delete(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (conversationId === id) {
        navigate('/admission/ai')
      }
    } catch {
      message.error('删除对话失败，请稍后重试')
    }
  }

  const handleSubmit = async (value: string) => {
    if (!value.trim() || loading) return

    if (!useAuthStore.getState().hasActiveMembership) {
      usePaywallStore.getState().openPaywall({
        featureName: '智能填报',
        trigger: 'pre_check',
        recommendedPlan: 'quarterly',
      })
      return
    }

    let convId = conversationId
    if (!convId) {
      try {
        const res = await conversationApi.create(value.slice(0, 20))
        const conv = res.data?.data
        if (conv) {
          convId = conv.id
          setConversations((prev) => [conv, ...prev])
          navigate(`/admission/ai?id=${conv.id}`, { replace: true })
        }
      } catch {
        message.error('创建对话失败，请稍后重试')
        return
      }
    }

    if (!convId) return

    setSuggestionsByConversation((prev) => ({ ...prev, [convId]: [] }))
    setEditingKey(null)

    const userMessage: ChatItem = {
      key: Date.now(),
      role: 'user',
      content: value,
      segments: [{ type: 'text', content: value }],
      chatStatus: 'done',
      status: 'success',
      placement: 'end',
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    const aiMessageKey = Date.now() + 1
    const aiMessage: ChatItem = {
      key: aiMessageKey,
      role: 'ai',
      content: '',
      segments: [],
      chatStatus: 'streaming',
      status: 'loading',
      placement: 'start',
      loading: true,
    }
    setMessages((prev) => [...prev, aiMessage])

    setTimeout(scrollToBottom, 50)

    startChatStream(convId, value, aiMessageKey)
  }

  const handleCancel = () => {
    abortRef.current?.()
    setLoading(false)
    flushPending(true)
    const aiKey = activeAIKeyRef.current
    if (aiKey) {
      setMessages((prev) =>
        prev.map((m) =>
          m.key === aiKey
            ? {
                ...m,
                loading: false,
                chatStatus: m.content ? 'done' : 'error',
                status: m.content ? 'success' : 'error',
                toolCallStatus: undefined,
              }
            : m
        )
      )
    }
  }

  const handlePickSuggestion = (value: string) => {
    setInputValue(value)
  }

  const handlePickWelcomeQuestion = async (value: string) => {
    if (!value.trim()) return
    if (conversationId) {
      setInputValue(value)
      return
    }
    try {
      const res = await conversationApi.create(value.slice(0, 20))
      const conv = res.data?.data
      if (conv) {
        pendingDraftRef.current = value
        setConversations((prev) => [conv, ...prev])
        navigate(`/admission/ai?id=${conv.id}`, { replace: true })
      }
    } catch {
      message.error('创建对话失败，请稍后重试')
    }
  }

  const handleEdit = (item: ChatItem) => {
    if (!item.serverId || item.role !== 'user') return
    if (loading) return
    if (item.key !== lastUserKey) return
    setEditingKey(item.key)
  }

  const handleSaveEdit = async (item: ChatItem, nextValue: string) => {
    if (!conversationId) return
    if (!item.serverId) return
    if (!nextValue.trim()) return

    setEditingSaving(true)
    abortRef.current?.()

    try {
      await conversationApi.rollback(conversationId, { message_id: item.serverId, inclusive: true })
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.key === item.key)
        if (idx < 0) return prev
        return prev.slice(0, idx)
      })
      setEditingKey(null)
      setEditingSaving(false)
      await handleSubmit(nextValue)
    } catch {
      setEditingSaving(false)
      message.error('编辑失败，请稍后重试')
    }
  }

  const handleRegenerate = () => {
    if (!conversationId) return
    if (!lastAIKey) return
    const last = messages.find((m) => m.key === lastAIKey)
    if (!last || last.role !== 'ai' || last.chatStatus !== 'done') return

    if (!useAuthStore.getState().hasActiveMembership) {
      usePaywallStore.getState().openPaywall({
        featureName: '智能填报',
        trigger: 'pre_check',
        recommendedPlan: 'quarterly',
      })
      return
    }

    setSuggestionsByConversation((prev) => ({ ...prev, [conversationId]: [] }))
    setLoading(true)
    setMessages((prev) =>
      prev.map((m) =>
        m.key === lastAIKey
          ? {
              ...m,
              content: '',
              segments: [],
              chatStatus: 'streaming',
              status: 'loading',
              loading: true,
              toolCallStatus: undefined,
            }
          : m
      )
    )
    startRegenerateStream(conversationId, lastAIKey)
  }

  return (
    <Layout style={{ height: '100%', width: '100%', minHeight: 0, background: token.colorBgContainer, borderRadius: token.borderRadius }}>
      <Sider
        width={260}
        theme="light"
        style={{
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block
            onClick={handleCreateConversation}
          >
            新建对话
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {conversationsLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin size="small" />
            </div>
          ) : conversations.length === 0 ? (
            <Empty description="暂无对话" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 32 }} />
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: token.borderRadius,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                  background: conversationId === conv.id ? token.colorPrimaryBg : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <MessageOutlined style={{ color: token.colorTextSecondary, flexShrink: 0 }} />
                <Text
                  ellipsis
                  style={{ flex: 1, color: conversationId === conv.id ? token.colorPrimary : token.colorText }}
                >
                  {conv.title || '未命名对话'}
                </Text>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  style={{ opacity: 0.5 }}
                />
              </div>
            ))
          )}
        </div>
      </Sider>

      <Content style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px 32px',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Welcome
                icon={<RobotOutlined style={{ fontSize: 48, color: token.colorPrimary }} />}
                title="智能填报助手"
                description="我可以帮你筛选院校、分析录取数据、制定志愿填报策略。"
              />
              <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Tag
                  icon={<BulbOutlined />}
                  style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 14 }}
                  onClick={() => void Promise.resolve().then(() => handlePickWelcomeQuestion('我想看985院校在黑龙江的录取数据'))}
                >
                  我想看985院校在黑龙江的录取数据
                </Tag>
                <Tag
                  icon={<BulbOutlined />}
                  style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 14 }}
                  onClick={() => void Promise.resolve().then(() => handlePickWelcomeQuestion('我不想去北京的学校'))}
                >
                  我不想去北京的学校
                </Tag>
                <Tag
                  icon={<BulbOutlined />}
                  style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 14 }}
                  onClick={() => void Promise.resolve().then(() => handlePickWelcomeQuestion('我的分数是650分，理科'))}
                >
                  我的分数是650分，理科
                </Tag>
              </div>
            </div>
          ) : (
            <Bubble.List
              items={messages}
              role={{
                user: (data) => {
                  const chatItem = data as ChatItem
                  const isEditing = editingKey === chatItem.key
                  const text = chatItem.segments
                    .filter((s) => s.type === 'text')
                    .map((s) => s.content)
                    .join('')
                  return {
                    placement: 'end',
                    avatar: <Avatar icon={<UserOutlined />} style={{ background: token.colorPrimary }} size="small" />,
                    variant: 'shadow',
                    footerPlacement: 'outer-end',
                    footer:
                      !isEditing && chatItem.serverId && chatItem.key === lastUserKey
                        ? () => (
                            <div className="ai-chat-bubble-actions">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                style={{ color: token.colorTextSecondary }}
                                onClick={() => handleEdit(chatItem)}
                              >
                                编辑
                              </Button>
                            </div>
                          )
                        : null,
                    contentRender: () => (
                      <div className="ai-chat-bubble ai-chat-bubble-user">
                        <div className="ai-chat-bubble-body">
                          {isEditing ? (
                            <MessageEditor
                              key={chatItem.key}
                              initialValue={text || chatItem.content || ''}
                              saving={editingSaving}
                              onCancel={() => setEditingKey(null)}
                              onSave={(v) => void handleSaveEdit(chatItem, v)}
                            />
                          ) : (
                            <SegmentRenderer segments={chatItem.segments} />
                          )}
                        </div>
                      </div>
                    ),
                  }
                },
                ai: (data) => {
                  const chatItem = data as ChatItem
                  const showRegenerate = chatItem.key === lastAIKey && chatItem.chatStatus === 'done'
                  return {
                    placement: 'start',
                    avatar: <Avatar icon={<RobotOutlined />} style={{ background: '#52c41a' }} size="small" />,
                    variant: 'filled',
                    loadingRender: () => <Spin size="small" />,
                    footerPlacement: 'outer-start',
                    footer: showRegenerate
                      ? () => (
                          <div className="ai-chat-bubble-actions">
                            <Button
                              type="text"
                              size="small"
                              icon={<RedoOutlined />}
                              style={{ color: token.colorTextSecondary }}
                              onClick={handleRegenerate}
                            >
                              重新生成
                            </Button>
                          </div>
                        )
                      : null,
                    contentRender: () => (
                      <div className="ai-chat-bubble ai-chat-bubble-ai">
                        {chatItem.toolCallStatus ? (
                          <div className="ai-chat-tool-status">正在调用 {chatItem.toolCallStatus.toolName}...</div>
                        ) : null}
                        <div className="ai-chat-bubble-body">
                          <SegmentRenderer segments={chatItem.segments} />
                        </div>
                      </div>
                    ),
                  }
                },
              }}
            />
          )}
        </div>

        <div
          style={{
            padding: '16px 32px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
          }}
        >
          <SuggestionPills suggestions={suggestions} disabled={!!inputValue.trim()} onPick={handlePickSuggestion} />
          <Sender
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            placeholder="输入你的问题，例如：我不想去北京的学校..."
            allowSpeech={false}
          />
        </div>
      </Content>
    </Layout>
  )
}
