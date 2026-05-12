import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar, Button, Empty, Layout, Spin, Tag, Typography, message, theme } from 'antd'
import type { AxiosError } from 'axios'
import {
  BulbOutlined,
  DeleteOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Bubble, Sender, Welcome } from '@ant-design/x'
import type { BubbleItemType } from '@ant-design/x/es/bubble'
import { conversationApi, type Conversation, type Message } from '@/services/conversation'
import { streamChatWithConversation, type SSEEvent } from '@/services/ai'

const { Sider, Content } = Layout
const { Text } = Typography

interface ChatItem extends BubbleItemType {
  role: 'user' | 'ai' | 'system'
  content: string
  key: string | number
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
  const abortRef = useRef<(() => void) | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
    return (data?.messages ?? []).map((m: Message) => ({
      key: m.id,
      role: m.role === 'user' ? 'user' : 'ai',
      content: m.content,
      placement: m.role === 'user' ? 'end' : 'start',
    }))
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

    let ignore = false

    void Promise.resolve().then(async () => {
      if (ignore) return

      setLoading(false)
      setInputValue('')
      setMessages([])

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
    }
  }, [conversationId, loadMessages, navigate])

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }

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

    const userMessage: ChatItem = {
      key: Date.now(),
      role: 'user',
      content: value,
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
      placement: 'start',
      loading: true,
    }
    setMessages((prev) => [...prev, aiMessage])

    setTimeout(scrollToBottom, 50)

    let fullText = ''
    abortRef.current = streamChatWithConversation(
      convId,
      value,
      (event: SSEEvent) => {
        if (event.type === 'text_delta') {
          fullText += event.content || ''
          setMessages((prev) =>
            prev.map((m) =>
              m.key === aiMessageKey
                ? { ...m, content: fullText, loading: false }
                : m
            )
          )
          setTimeout(scrollToBottom, 50)
        } else if (event.type === 'done') {
          setLoading(false)
        } else if (event.type === 'error') {
          setLoading(false)
          setMessages((prev) =>
            prev.map((m) =>
              m.key === aiMessageKey
                ? { ...m, content: fullText || '抱歉，发生了错误，请重试。', loading: false }
                : m
            )
          )
        }
      },
      (err) => {
        setLoading(false)
        setMessages((prev) =>
          prev.map((m) =>
            m.key === aiMessageKey
              ? { ...m, content: fullText || `错误: ${err.message}`, loading: false }
              : m
          )
        )
      }
    )
  }

  const handleCancel = () => {
    abortRef.current?.()
    setLoading(false)
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
                  onClick={() => setInputValue('我想看985院校在黑龙江的录取数据')}
                >
                  我想看985院校在黑龙江的录取数据
                </Tag>
                <Tag
                  icon={<BulbOutlined />}
                  style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 14 }}
                  onClick={() => setInputValue('我不想去北京的学校')}
                >
                  我不想去北京的学校
                </Tag>
                <Tag
                  icon={<BulbOutlined />}
                  style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 14 }}
                  onClick={() => setInputValue('我的分数是650分，理科')}
                >
                  我的分数是650分，理科
                </Tag>
              </div>
            </div>
          ) : (
            <Bubble.List
              items={messages}
              role={{
                user: {
                  placement: 'end',
                  avatar: <Avatar icon={<UserOutlined />} style={{ background: token.colorPrimary }} size="small" />,
                  variant: 'shadow',
                },
                ai: {
                  placement: 'start',
                  avatar: <Avatar icon={<RobotOutlined />} style={{ background: '#52c41a' }} size="small" />,
                  variant: 'filled',
                  loadingRender: () => <Spin size="small" />,
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
