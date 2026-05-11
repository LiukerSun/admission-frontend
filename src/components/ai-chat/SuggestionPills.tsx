import { Tag } from 'antd'

type Props = {
  suggestions: string[]
  disabled?: boolean
  onPick: (value: string) => void
}

export default function SuggestionPills({ suggestions, disabled, onPick }: Props) {
  if (!suggestions.length) return null

  return (
    <div
      className="ai-chat-suggestions"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
        opacity: disabled ? 0 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}
    >
      {suggestions.slice(0, 4).map((s) => (
        <Tag key={s} style={{ cursor: 'pointer', padding: '6px 10px' }} onClick={() => onPick(s)}>
          {s}
        </Tag>
      ))}
    </div>
  )
}

