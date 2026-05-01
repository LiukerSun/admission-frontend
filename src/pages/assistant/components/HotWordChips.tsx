import { ChipGroup } from '@/components/ui'
import styles from './HotWordChips.module.css'

export type HotWordChipsProps = {
  title: string
  words: string[]
  onSelect: (word: string) => void
}

export default function HotWordChips({ title, words, onSelect }: HotWordChipsProps) {
  return (
    <div className={styles.root}>
      <div className={styles.title}>{title}</div>
      <ChipGroup items={words.map((w) => ({ key: w, label: w }))} onChange={onSelect} className={styles.chips} />
    </div>
  )
}

