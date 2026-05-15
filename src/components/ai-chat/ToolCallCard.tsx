import { useMemo } from 'react'
import { Spin, Tag } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, ThunderboltFilled } from '@ant-design/icons'
import type { ToolCallSegmentStatus } from './types'

type Props = {
  toolName: string
  status: ToolCallSegmentStatus
  result?: unknown
  errorMsg?: string
}

// User-facing labels for each tool. We deliberately avoid words like
// "草稿 / 试算 / dry_run / draft" — those are internal mechanics. From
// the user's perspective every tool call is "AI 正在筛选 / 已分析"。
const TOOL_LABELS: Record<string, { running: string; done: string }> = {
  generate_volunteer_plan_draft: { running: 'AI 正在筛选候选', done: '完成一轮筛选' },
  search_universities: { running: '检索院校中', done: '院校检索完成' },
  aggregate_data: { running: '统计中', done: '统计完成' },
  apply_filter: { running: '更新筛选条件', done: '筛选条件已更新' },
  render_card: { running: '准备展示卡片', done: '卡片就绪' },
  render_chart: { running: '准备图表', done: '图表就绪' },
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function pickNumber(rec: Record<string, unknown>, key: string): number | null {
  const v = rec[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

// summariseResult turns a parsed tool result into the headline tags
// shown on the card. We surface only user-friendly numbers (pool size,
// 冲/稳/保 breakdown). Internal mechanics — dry_run flags, draft_id,
// "硬过滤 N 项" lists — are dropped on purpose; the user does not
// need to see them and they shatter the illusion of "智能筛选".
function summariseResult(toolName: string, result: unknown): string[] {
  const rec = asRecord(result)
  if (!rec) return []

  switch (toolName) {
    case 'generate_volunteer_plan_draft': {
      const poolSize = pickNumber(rec, 'pool_size')
      const planSize = pickNumber(rec, 'plan_size')
      const rush = pickNumber(rec, 'pool_rush_count')
      const match = pickNumber(rec, 'pool_match_count')
      const safe = pickNumber(rec, 'pool_safe_count')
      const out: string[] = []
      if (poolSize !== null) {
        out.push(planSize !== null ? `候选 ${poolSize} 个 · 目标 ${planSize} 个` : `候选 ${poolSize} 个`)
      }
      if (rush !== null || match !== null || safe !== null) {
        out.push(`冲 ${rush ?? '?'} · 稳 ${match ?? '?'} · 保 ${safe ?? '?'}`)
      }
      return out
    }
    case 'search_universities': {
      const list = rec.items ?? rec.universities ?? rec.results ?? rec.data
      if (Array.isArray(list)) return [`匹配 ${list.length} 所院校`]
      const total = pickNumber(rec, 'total')
      if (total !== null) return [`匹配 ${total} 所院校`]
      return []
    }
    case 'aggregate_data': {
      const list = rec.items ?? rec.rows ?? rec.results
      if (Array.isArray(list)) return [`分析 ${list.length} 条数据`]
      const total = pickNumber(rec, 'total')
      if (total !== null) return [`分析 ${total} 条数据`]
      return []
    }
    default:
      return []
  }
}

export default function ToolCallCard({ toolName, status, result, errorMsg }: Props) {
  const labels = TOOL_LABELS[toolName] || { running: 'AI 处理中', done: '处理完成' }
  const summary = useMemo(() => summariseResult(toolName, result), [toolName, result])

  const accent = status === 'error' ? '#ff7875' : status === 'pending' ? '#1677ff' : '#52c41a'

  return (
    <div
      className="ai-chat-tool-card"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'rgba(22, 119, 255, 0.06)',
        border: `1px solid ${accent}33`,
        fontSize: 13,
        lineHeight: 1.4,
        maxWidth: '100%',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: accent, fontWeight: 500 }}>
        {status === 'pending' ? (
          <Spin size="small" />
        ) : status === 'error' ? (
          <CloseCircleFilled />
        ) : (
          <ThunderboltFilled />
        )}
        <span>{status === 'pending' ? labels.running : status === 'error' ? `${labels.done.replace(/完成$/, '')}失败` : labels.done}</span>
        {status === 'success' ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 11 }} /> : null}
      </span>
      {status === 'success' && summary.length ? (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
          {summary.map((s, i) => (
            <Tag key={i} bordered={false} color="processing" style={{ marginInlineEnd: 0, fontSize: 12 }}>
              {s}
            </Tag>
          ))}
        </span>
      ) : null}
      {status === 'error' && errorMsg ? (
        <span style={{ color: '#ff4d4f', fontSize: 12 }}>{errorMsg}</span>
      ) : null}
    </div>
  )
}
