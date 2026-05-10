import { API_BASE_URL } from '@/utils/constants'
import { useAuthStore } from '@/stores/authStore'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

export interface SSEEvent {
  type: 'step_start' | 'step_finish' | 'text_delta' | 'done' | 'error'
  step?: string
  content?: string
  data?: unknown
}

export interface AgentResult {
  text: string
  tool_calls?: unknown[]
  filter?: unknown
  data?: unknown
}

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().accessToken
  return {
    'Content-Type': 'application/json',
    'X-Platform': 'web',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function streamChat(
  messages: AIMessage[],
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  const abortController = new AbortController()

  fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ messages }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const event: SSEEvent = JSON.parse(data)
              onEvent(event)
            } catch {
              // ignore malformed events
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err)
      }
    })

  return () => abortController.abort()
}

export function streamChatWithConversation(
  conversationId: number,
  message: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  const abortController = new AbortController()

  fetch(`${API_BASE_URL}/api/v1/conversations/${conversationId}/ai-chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const event: SSEEvent = JSON.parse(data)
              onEvent(event)
            } catch {
              // ignore malformed events
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err)
      }
    })

  return () => abortController.abort()
}
