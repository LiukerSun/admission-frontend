import styles from './ChipGroup.module.css'

export type ChipSize = 'sm' | 'md'

export type ChipItem = {
  key: string
  label: React.ReactNode
  disabled?: boolean
}

export type ChipGroupProps = {
  items: ChipItem[]
  value?: string
  onChange?: (key: string) => void
  size?: ChipSize
  disabled?: boolean
  className?: string
}

const sizeClassName: Record<ChipSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
}

export default function ChipGroup({ items, value, onChange, size = 'md', disabled, className }: ChipGroupProps) {
  return (
    <div className={[styles.root, sizeClassName[size], className].filter(Boolean).join(' ')}>
      {items.map((it) => {
        const isActive = value === it.key
        const isDisabled = Boolean(disabled || it.disabled)
        return (
          <button
            key={it.key}
            type="button"
            className={[styles.chip, isActive ? styles.active : ''].filter(Boolean).join(' ')}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return
              onChange?.(it.key)
            }}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

