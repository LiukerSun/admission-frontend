import { Tag, Typography } from 'antd'
import CardWidget from './CardWidget'
import ChartWidget from './ChartWidget'
import FormWidget from './FormWidget'
import Markdown from './Markdown'
import ToolCallCard from './ToolCallCard'
import type {
  FormSubmissionPayload,
  FormSubmissionValue,
  Segment,
} from './types'

type Props = {
  segments: Segment[]
  // 用户提交表单时父组件如何处理（通常 = 把 form_submission 代码块作为
  // user message 发给 backend）。不传则表单只读。
  // 第二个参数 ownerConversationId 透传自 FormWidget 挂载时固化的 conv id；
  // 父组件应据此校验"提交时 conv 是否还是这个"，避免切对话竞态。
  onFormSubmit?: (submission: FormSubmissionPayload, ownerConversationId: number | null) => void
  // 已提交过的表单 id → 当时勾选的值。FormWidget 据此进入只读状态并回显。
  submittedForms?: Record<string, Record<string, FormSubmissionValue>>
  // 当前对话 id，透传给 FormWidget 让它在挂载时固化进 ref 作为提交校验依据。
  conversationId?: number | null
}

// ITERATION_BREAK is the protocol marker the backend inserts between
// successive assistant text turns within a single agent run. When a
// loadMessages payload still carries it (e.g. the splitter ran into a
// malformed run), strip it here so it never leaks into rendered prose.
const ITERATION_BREAK_RE = /\n\n\[\[ITERATION_BREAK\]\]\n\n/g

function looksLikeRecommendationSnapshotJSON(input: string) {
  const trimmed = input.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
    const keys = [
      'region_code',
      'subject_category_code',
      'total_score',
      'provincial_rank',
      'priority_strategy',
      'plan_size',
      'enable_llm_tuning',
    ]
    return keys.some((k) => k in obj)
  } catch {
    return false
  }
}

type FormSubmissionInfo = { fieldCount: number; values: Record<string, FormSubmissionValue> }

// extractFormSubmission 把 ```form_submission``` 代码块解析成结构化摘要。
// 返回 null 表示这段文本里没有合法的 form_submission 块。
function extractFormSubmission(content: string): FormSubmissionInfo | null {
  const codeBlockRe = /```\s*form_submission\s*\n([\s\S]*?)\n?```/g
  let last: FormSubmissionInfo | null = null
  for (const match of content.matchAll(codeBlockRe)) {
    const body = (match[1] || '').trim()
    try {
      const parsed = JSON.parse(body) as { values?: Record<string, FormSubmissionValue> }
      const values = parsed?.values || {}
      last = { fieldCount: Object.keys(values).length, values }
    } catch {
      // 半成品块——streaming 中可能出现，跳过等下一轮。
    }
  }
  return last
}

function stripPrivateBlocks(content: string) {
  const privateLang = new Set([
    'recommendation_request',
    'recommendation_snapshot',
    'volunteer_plan_draft',
    'form_submission',
  ])
  const codeBlockRe = /```([^\n`]*)\n([\s\S]*?)```/g

  const stripped = content.replace(ITERATION_BREAK_RE, '\n\n').replace(codeBlockRe, (full, langRaw, bodyRaw) => {
    const lang = String(langRaw || '').trim().toLowerCase()
    const body = String(bodyRaw || '')

    if (privateLang.has(lang)) return ''
    if (lang === 'json' || lang === '') {
      if (looksLikeRecommendationSnapshotJSON(body)) return ''
    }
    return full
  })

  return stripped.trim()
}

export default function SegmentRenderer({ segments, onFormSubmit, submittedForms, conversationId }: Props) {
  return (
    <div className="ai-chat-segments" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          const raw = seg.content || ''
          // form_submission 代码块来自"用户提交表单"消息——把它替换为
          // 一个灰色摘要标签，避免把私有 JSON 暴露在对话流里。
          const submission = extractFormSubmission(raw)
          const display = stripPrivateBlocks(raw)
          if (submission && !display) {
            return (
              <Typography.Text key={`t-${idx}`} type="secondary" style={{ fontSize: 12 }}>
                <Tag color="default" style={{ marginInlineEnd: 4 }}>✓ 已提交</Tag>
                {submission.fieldCount} 项偏好
              </Typography.Text>
            )
          }
          if (!display) return null
          return <Markdown key={`t-${idx}`} content={display} />
        }

        if (seg.type === 'tool_call') {
          return (
            <div key={`tc-${seg.callId || idx}`} className="ai-chat-tool-call">
              <ToolCallCard
                toolName={seg.toolName}
                status={seg.status}
                result={seg.result}
                errorMsg={seg.errorMsg}
              />
            </div>
          )
        }

        if (seg.kind === 'chart') {
          return (
            <div key={`w-${seg.id || idx}`} className="ai-chat-widget">
              <ChartWidget payload={seg.payload} />
            </div>
          )
        }

        if (seg.kind === 'form') {
          const submitted = submittedForms?.[seg.id]
          return (
            <div key={`w-${seg.id || idx}`} className="ai-chat-widget">
              <FormWidget
                widgetId={seg.id}
                payload={seg.payload}
                onSubmit={onFormSubmit}
                disabled={!!submitted || !onFormSubmit}
                submittedValues={submitted}
                ownerConversationId={conversationId ?? null}
              />
            </div>
          )
        }

        return (
          <div key={`w-${seg.id || idx}`} className="ai-chat-widget">
            <CardWidget payload={seg.payload} />
          </div>
        )
      })}
    </div>
  )
}
