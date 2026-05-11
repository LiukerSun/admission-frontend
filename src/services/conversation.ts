import api from './api'

export interface Conversation {
  id: number
  user_id?: number
  title: string
  status: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: string
  content: string
  widgets?: Array<{ id: string; kind: 'chart' | 'card'; payload: Record<string, unknown> }>
  tool_calls?: unknown
  tool_results?: unknown
  created_at: string
}

type Envelope<T> = {
  code: number
  message?: string
  data?: T
}

export const conversationApi = {
  create: (title: string) =>
    api.post<Envelope<Conversation>>('/api/v1/conversations', { title }),

  list: () =>
    api.get<Envelope<Conversation[]>>('/api/v1/conversations'),

  get: (id: number) =>
    api.get<Envelope<{ conversation: Conversation; messages: Message[] }>>(`/api/v1/conversations/${id}`),

  // addMessage only ever inserts a *user* message. The server forces
  // role="user" and ignores tool_calls/tool_results, so this client
  // signature deliberately exposes only `content`. Assistant replies are
  // produced exclusively by /ai-chat.
  addMessage: (id: number, content: string) =>
    api.post<Envelope<Message>>(`/api/v1/conversations/${id}/messages`, { content }),

  delete: (id: number) =>
    api.delete<Envelope<null>>(`/api/v1/conversations/${id}`),

  archive: (id: number) =>
    api.post<Envelope<null>>(`/api/v1/conversations/${id}/archive`),

  rollback: (id: number, body: { message_id: number; inclusive?: boolean }) =>
    api.post<Envelope<null>>(`/api/v1/conversations/${id}/rollback`, body),

  suggestions: (id: number) =>
    api.get<Envelope<{ suggestions: string[] }>>(`/api/v1/conversations/${id}/suggestions`),
}
