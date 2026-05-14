import CardWidget from './CardWidget'
import ChartWidget from './ChartWidget'
import Markdown from './Markdown'
import type { Segment } from './types'

type Props = {
  segments: Segment[]
}

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

function stripPrivateBlocks(content: string) {
  const privateLang = new Set(['recommendation_request', 'recommendation_snapshot', 'volunteer_plan_draft'])
  const codeBlockRe = /```([^\n`]*)\n([\s\S]*?)```/g

  const stripped = content.replace(codeBlockRe, (full, langRaw, bodyRaw) => {
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

export default function SegmentRenderer({ segments }: Props) {
  return (
    <div className="ai-chat-segments" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          const display = stripPrivateBlocks(seg.content || '')
          if (!display) return null
          return <Markdown key={`t-${idx}`} content={display} />
        }

        if (seg.kind === 'chart') {
          return (
            <div key={`w-${seg.id || idx}`} className="ai-chat-widget">
              <ChartWidget payload={seg.payload} />
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

