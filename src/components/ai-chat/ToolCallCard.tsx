import { useEffect, useMemo, useState } from 'react'
import { Tag } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, ThunderboltFilled } from '@ant-design/icons'
import type { ToolCallSegmentStatus } from './types'

type Props = {
  toolName: string
  status: ToolCallSegmentStatus
  result?: unknown
  errorMsg?: string
}

// pendingPhrases 给每个工具一组"递进式的进度描述"——pending 时按 1.6s
// 节奏轮播显示，让用户感觉到 AI 在做不同的事，而不是一个静止的 spinner。
// 完整 phrases 走完一轮就停在最后一句，避免让用户产生"卡住反复同一步"的错觉。
const PENDING_PHRASES: Record<string, string[]> = {
  generate_volunteer_plan_draft: [
    '理解你的偏好…',
    '扫描全国院校…',
    '匹配位次区间…',
    '按冲稳保算分配…',
  ],
  search_universities: ['搜索院校数据…', '匹配筛选条件…', '排序结果…'],
  aggregate_data: ['加载历年录取…', '聚合统计…', '生成趋势…'],
  apply_filter: ['更新筛选条件…'],
  render_card: ['整理院校卡片…'],
  render_chart: ['绘制数据图表…'],
  render_form: ['准备偏好表单…'],
}

const DONE_LABELS: Record<string, string> = {
  generate_volunteer_plan_draft: '匹配完成',
  search_universities: '搜索完成',
  aggregate_data: '分析完成',
  apply_filter: '条件已更新',
  render_card: '卡片就绪',
  render_chart: '图表就绪',
  render_form: '表单已发送',
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

// formatThousand 给大数字加千分位，让 "2767" 变 "2,767" —— 视觉上更"高大上"。
function formatThousand(n: number): string {
  return n.toLocaleString('zh-CN')
}

// summariseResult 把 tool 输出翻译成 1-2 个非技术 tag。
// 完全不暴露 dry_run / pool_size / draft_id 等内部词汇。
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
        out.push(
          planSize !== null
            ? `匹配 ${formatThousand(poolSize)} 所 · 目标 ${planSize}`
            : `匹配 ${formatThousand(poolSize)} 所`,
        )
      }
      if (rush !== null || match !== null || safe !== null) {
        out.push(`冲 ${rush ?? '?'} · 稳 ${match ?? '?'} · 保 ${safe ?? '?'}`)
      }
      return out
    }
    case 'search_universities': {
      const list = rec.items ?? rec.universities ?? rec.results ?? rec.data
      if (Array.isArray(list)) return [`找到 ${list.length} 所院校`]
      const total = pickNumber(rec, 'total')
      if (total !== null) return [`找到 ${total} 所院校`]
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

// usePhraseRotator 在 enabled=true 时按 intervalMs 轮播 phrases，
// 返回当前 index + 一个 fading 标志（用于 CSS opacity 过渡）。
// disabled 时 index 固定为 0，给后续 transition 留干净起点。
function usePhraseRotator(phrases: string[], enabled: boolean, intervalMs = 1600) {
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!enabled || phrases.length <= 1) return
    let cancelled = false
    const id = window.setInterval(() => {
      if (cancelled) return
      setFading(true)
      window.setTimeout(() => {
        if (cancelled) return
        setIndex((i) => {
          // 走到最后一句就停下来——避免给用户"循环跑同一步"的错觉。
          if (i >= phrases.length - 1) return i
          return i + 1
        })
        setFading(false)
      }, 280) // 与 CSS transition 时长对齐
    }, intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [enabled, phrases, intervalMs])

  return { index, fading }
}

export default function ToolCallCard({ toolName, status, result, errorMsg }: Props) {
  const phrases = useMemo(
    () => PENDING_PHRASES[toolName] || ['AI 处理中…'],
    [toolName],
  )
  const doneLabel = DONE_LABELS[toolName] || '处理完成'
  const summary = useMemo(() => summariseResult(toolName, result), [toolName, result])
  const { index: phraseIdx, fading } = usePhraseRotator(phrases, status === 'pending')

  const accent = status === 'error' ? '#ff7875' : status === 'pending' ? '#1677ff' : '#52c41a'

  const label =
    status === 'pending'
      ? phrases[phraseIdx]
      : status === 'error'
      ? `${doneLabel.replace(/完成$/, '')}失败`
      : doneLabel

  return (
    <div
      className="ai-chat-tool-card"
      data-status={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        padding: '7px 14px',
        borderRadius: 999,
        background: status === 'pending' ? undefined : 'rgba(22, 119, 255, 0.06)',
        border: `1px solid ${accent}33`,
        fontSize: 13,
        lineHeight: 1.4,
        maxWidth: '100%',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: accent, fontWeight: 500 }}>
        {status === 'error' ? (
          <CloseCircleFilled />
        ) : status === 'success' ? (
          <ThunderboltFilled />
        ) : null}
        <span className="ai-chat-tool-card-label" data-fading={fading}>
          {label}
        </span>
        {status === 'pending' ? <span className="ai-chat-tool-card-progress" /> : null}
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
