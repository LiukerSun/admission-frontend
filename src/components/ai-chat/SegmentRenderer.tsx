import CardWidget from './CardWidget'
import ChartWidget from './ChartWidget'
import Markdown from './Markdown'
import type { Segment } from './types'

type Props = {
  segments: Segment[]
}

function stripPrivateBlocks(content: string) {
  return content
    .replace(/```recommendation_request[\s\S]*?```/gi, '')
    .replace(/```volunteer_plan_draft[\s\S]*?```/gi, '')
    .trim()
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

