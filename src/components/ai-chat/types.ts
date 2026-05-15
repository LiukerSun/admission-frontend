export type WidgetKind = 'chart' | 'card'

export type TextSegment = { type: 'text'; content: string }

export type WidgetSegment = {
  type: 'widget'
  id: string
  kind: WidgetKind
  payload: Record<string, unknown>
}

export type ToolCallSegmentStatus = 'pending' | 'success' | 'error'

// ToolCallSegment renders an inline summary card for one LLM tool call
// (pool_size, 冲/稳/保, etc.) so multi-iteration runs show the timeline
// (text → tool → text → tool → text) rather than collapsing to the
// final assistant message. `result` holds the parsed JSON returned by
// the tool when available; the renderer extracts a few headline
// numbers and lets the user expand to see the raw payload.
export type ToolCallSegment = {
  type: 'tool_call'
  callId: string
  toolName: string
  status: ToolCallSegmentStatus
  result?: unknown
  errorMsg?: string
}

export type Segment = TextSegment | WidgetSegment | ToolCallSegment

export type ChatStatus = 'streaming' | 'done' | 'error'

export type ToolCallStatus = { toolName: string; callId: string }
