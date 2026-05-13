import { API_BASE_URL } from '@/utils/constants'
import { useAuthStore } from '@/stores/authStore'
import { triggerPaywallIfMatch, tryParsePaywallText } from '@/services/paywall'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

export type SSEEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'widget'; id: string; kind: 'chart' | 'card'; payload: Record<string, unknown> }
  | { type: 'tool_call_start'; call_id: string; tool_name: string }
  | { type: 'tool_call_end'; call_id: string; success: boolean }
  | { type: 'done'; data?: unknown }
  | { type: 'error'; content: string }
  | { type: 'warning'; content: string }
  | { type: 'step_start' | 'step_finish'; step?: string; content?: string; data?: unknown }

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

function streamSSE(
  url: string,
  body: unknown,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  const abortController = new AbortController()

  fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text()
        // SSE doesn't go through axios, so paywall detection happens inline.
        if (response.status === 403) {
          const paywall = tryParsePaywallText(text)
          if (paywall && triggerPaywallIfMatch(paywall)) {
            throw new Error('membership_required')
          }
        }
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

export function streamChat(
  messages: AIMessage[],
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  return streamSSE(`${API_BASE_URL}/api/v1/ai/chat`, { messages }, onEvent, onError)
}

export function streamChatWithConversation(
  conversationId: number,
  message: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  return streamSSE(
    `${API_BASE_URL}/api/v1/conversations/${conversationId}/ai-chat`,
    { message },
    onEvent,
    onError
  )
}

export function streamRegenerateWithConversation(
  conversationId: number,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  return streamSSE(`${API_BASE_URL}/api/v1/conversations/${conversationId}/regenerate`, {}, onEvent, onError)
}
