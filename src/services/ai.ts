import { API_BASE_URL } from '@/utils/constants'
import { useAuthStore } from '@/stores/authStore'
import { triggerPaywallIfMatch, tryParsePaywallText } from '@/services/paywall'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

export type SSEEvent =
  | { type: 'text_delta'; content: string }
  | { type: 'widget'; id: string; kind: 'chart' | 'card' | 'form'; payload: Record<string, unknown> }
  | { type: 'tool_call_start'; call_id: string; tool_name: string }
  | { type: 'tool_call_end'; call_id: string; success: boolean; error?: string; result_content?: string }
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

type StreamSSEOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  // onStatus 在收到响应头时调用，用于让调用方在 204 / 409 等"没有 SSE
  // 流"的状态码上短路（StreamActiveTurn 用 204 表示"没有 active turn"，
  // ChatWithConversation 用 409 表示"已有 turn 在跑，请改走 stream"）。
  // 返回 true 表示调用方已处理，streamSSE 直接退出且不当作错误。
  onStatus?: (status: number, response: Response) => boolean | void
}

function streamSSE(
  url: string,
  options: StreamSSEOptions,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  const abortController = new AbortController()
  const method = options.method || 'POST'

  fetch(url, {
    method,
    headers: authHeaders(),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (options.onStatus && options.onStatus(response.status, response)) {
        return
      }
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
  return streamSSE(`${API_BASE_URL}/api/v1/ai/chat`, { body: { messages } }, onEvent, onError)
}

export function streamChatWithConversation(
  conversationId: number,
  message: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  return streamSSE(
    `${API_BASE_URL}/api/v1/conversations/${conversationId}/ai-chat`,
    { body: { message } },
    onEvent,
    onError
  )
}

export function streamRegenerateWithConversation(
  conversationId: number,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  return streamSSE(`${API_BASE_URL}/api/v1/conversations/${conversationId}/regenerate`, { body: {} }, onEvent, onError)
}

// streamActiveTurn 续看某 conversation 当前/最近的 active turn。
// onMissing 在 backend 返回 204（无 active turn）时触发，调用方可据此
// 决定不显示 placeholder。无 204 时按常规 SSE 路径处理。
export function streamActiveTurn(
  conversationId: number,
  onEvent: (event: SSEEvent) => void,
  onMissing: () => void,
  onError?: (err: Error) => void,
): () => void {
  return streamSSE(
    `${API_BASE_URL}/api/v1/conversations/${conversationId}/active-turn-stream`,
    {
      method: 'GET',
      onStatus: (status) => {
        if (status === 204) {
          onMissing()
          return true
        }
        return false
      },
    },
    onEvent,
    onError,
  )
}
