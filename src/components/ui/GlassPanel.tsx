import styles from './GlassPanel.module.css'

export type GlassPanelVariant = 'default' | 'soft' | 'solid'
export type GlassPanelPadding = 'none' | 'sm' | 'md' | 'lg'

export type GlassPanelProps = {
  variant?: GlassPanelVariant
  padding?: GlassPanelPadding
  interactive?: boolean
  active?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const variantClassName: Record<GlassPanelVariant, string> = {
  default: styles.variantDefault,
  soft: styles.variantSoft,
  solid: styles.variantSolid,
}

const paddingClassName: Record<GlassPanelPadding, string> = {
  none: styles.padNone,
  sm: styles.padSm,
  md: styles.padMd,
  lg: styles.padLg,
}

export default function GlassPanel({
  variant = 'default',
  padding = 'none',
  interactive,
  active,
  disabled,
  className,
  children,
  onClick,
}: GlassPanelProps) {
  const clickable = Boolean(onClick) && !disabled

  if (clickable) {
    return (
      <button
        type="button"
        className={[
          styles.root,
          variantClassName[variant],
          paddingClassName[padding],
          interactive ? styles.interactive : '',
          active ? styles.active : '',
          disabled ? styles.disabled : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    )
  }

  return (
    <div
      className={[
        styles.root,
        variantClassName[variant],
        paddingClassName[padding],
        interactive ? styles.interactive : '',
        active ? styles.active : '',
        disabled ? styles.disabled : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

