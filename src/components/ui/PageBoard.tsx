import styles from './PageBoard.module.css'

export type PageBoardTone = 'default'

export type PageBoardProps = {
  tone?: PageBoardTone
  className?: string
  innerClassName?: string
  children: React.ReactNode
}

const toneClassName: Record<PageBoardTone, string> = {
  default: styles.toneDefault,
}

export default function PageBoard({ tone = 'default', className, innerClassName, children }: PageBoardProps) {
  return (
    <div className={[styles.root, toneClassName[tone], className].filter(Boolean).join(' ')}>
      <div className={[styles.inner, innerClassName].filter(Boolean).join(' ')}>{children}</div>
    </div>
  )
}

