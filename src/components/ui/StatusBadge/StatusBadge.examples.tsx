import { StatusBadge } from './StatusBadge'

export function StatusBadgeExamples() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <StatusBadge label="已激活" tone="success" variant="dot" />
      <StatusBadge label="待处理" tone="warning" variant="filled" />
      <StatusBadge label="失败" tone="danger" variant="text" />
      <StatusBadge label="同步中" pulse tone="info" variant="dot" />
    </div>
  )
}
