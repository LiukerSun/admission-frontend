import CardWidget from './CardWidget'
import ChartWidget from './ChartWidget'
import Markdown from './Markdown'
import type { Segment } from './types'

type Props = {
  segments: Segment[]
}

export default function SegmentRenderer({ segments }: Props) {
  return (
    <div className="ai-chat-segments" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          if (!seg.content) return null
          return <Markdown key={`t-${idx}`} content={seg.content} />
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

