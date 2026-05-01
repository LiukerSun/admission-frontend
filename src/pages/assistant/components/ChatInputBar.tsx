import { Button, Input } from 'antd'
import { ArrowUpOutlined, SearchOutlined } from '@ant-design/icons'
import { GlassPanel } from '@/components/ui'
import styles from './ChatInputBar.module.css'

export type ChatInputBarProps = {
  value: string
  sending: boolean
  onChange: (value: string) => void
  onSend: () => void
}

export default function ChatInputBar({ value, sending, onChange, onSend }: ChatInputBarProps) {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <Input
        allowClear
        value={value}
        onChange={(e) => onChange(e.target.value)}
        prefix={<SearchOutlined />}
        placeholder="输入您的问题..."
        disabled={sending}
        onPressEnter={onSend}
      />
      <Button className={styles.sendBtn} icon={<ArrowUpOutlined />} loading={sending} onClick={onSend} />
    </GlassPanel>
  )
}

