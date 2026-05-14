export type WidgetKind = 'chart' | 'card'

export type TextSegment = { type: 'text'; content: string }

export type WidgetSegment = {
  type: 'widget'
  id: string
  kind: WidgetKind
  payload: Record<string, unknown>
}

export type Segment = TextSegment | WidgetSegment

export type ChatStatus = 'streaming' | 'done' | 'error'

export type ToolCallStatus = { toolName: string; callId: string }

