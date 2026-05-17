export type WidgetKind = 'chart' | 'card' | 'form'

// FormFieldType 与后端 form_fields.go formFieldType 保持一致。
// 新增类型时同步两端。
export type FormFieldType =
  | 'multi_select'
  | 'single_select'
  | 'number'
  | 'slider'

export type FormFieldOption = {
  value: string
  label: string
  group?: string
  // group_code 是分组的机器标识；启用 TreeSelect 整省勾选时作为省级
  // 节点的 value（= region_code），提交时直接落到 province target_param。
  group_code?: string
}

export type FormFieldDef = {
  key: string
  target_param: string
  // province_target_param 非空表示此 multi_select 字段允许"整省勾选"。
  // 前端用 TreeSelect 渲染，省份级选中提交时落到此 target_param，城市
  // 级选中落到 target_param。
  province_target_param?: string
  label: string
  helper?: string
  type: FormFieldType
  options?: FormFieldOption[]
  min?: number
  max?: number
  step?: number
  presets?: number[]
  allow_zero?: boolean
}

export type FormWidgetPayload = {
  title: string
  intro?: string
  fields: FormFieldDef[]
  submit_label: string
}

// FormSubmissionValue 覆盖各 FieldType 提交后的取值：
//   multi_select  → string[]
//   single_select → string
//   number/slider → number
export type FormSubmissionValue = string | string[] | number

export type FormSubmissionPayload = {
  form_id: string
  values: Record<string, FormSubmissionValue>
}

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
