import { Button, Input, Space } from 'antd'
import { useState } from 'react'

type Props = {
  initialValue: string
  saving?: boolean
  onCancel: () => void
  onSave: (value: string) => void
}

export default function MessageEditor({ initialValue, saving, onCancel, onSave }: Props) {
  const [value, setValue] = useState(() => initialValue)

  return (
    <Space direction="vertical" size={8} style={{ width: 420, maxWidth: '100%' }}>
      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoSize={{ minRows: 2, maxRows: 6 }}
      />
      <Space>
        <Button onClick={onCancel} disabled={saving}>
          取消
        </Button>
        <Button type="primary" onClick={() => onSave(value)} loading={saving} disabled={!value.trim()}>
          保存并发送
        </Button>
      </Space>
    </Space>
  )
}
