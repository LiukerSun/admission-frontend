import { Form, InputNumber, Radio, Typography } from 'antd'
import { PRIORITY_STRATEGY_OPTIONS } from '@/utils/profileLabels'

const { Text, Paragraph } = Typography

// Single-subject scores + filling strategy. All optional. The strategy radio
// shows Chinese labels only — the wire value is the code (`auto` / `school`
// / `major`) but the user never sees those strings.
export default function ScoresSection() {
  return (
    <div>
      <Paragraph type="secondary" style={{ marginTop: 0 }}>
        单科成绩可以让 AI 在专业匹配时考虑你的学科强项（例如数学突出 → 推荐数理强势专业）。填报策略决定相同分段内优先推荐院校还是专业。
      </Paragraph>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Form.Item label="数学" name="math_score">
          <InputNumber min={0} max={150} placeholder="0 - 150" style={{ width: '100%' }} addonAfter="分" />
        </Form.Item>
        <Form.Item label="物理" name="physics_score">
          <InputNumber min={0} max={150} placeholder="0 - 150" style={{ width: '100%' }} addonAfter="分" />
        </Form.Item>
        <Form.Item label="语文" name="chinese_score">
          <InputNumber min={0} max={150} placeholder="0 - 150" style={{ width: '100%' }} addonAfter="分" />
        </Form.Item>
        <Form.Item label="英语" name="english_score">
          <InputNumber min={0} max={150} placeholder="0 - 150" style={{ width: '100%' }} addonAfter="分" />
        </Form.Item>
      </div>

      <Form.Item label="填报策略" name="priority_strategy" style={{ marginBottom: 0 }}>
        <Radio.Group>
          {PRIORITY_STRATEGY_OPTIONS.map((opt) => (
            <Radio.Button key={opt.code} value={opt.code} style={{ minWidth: 160, textAlign: 'left', padding: '8px 16px', height: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text strong>{opt.label}</Text>
                {opt.hint && <Text type="secondary" style={{ fontSize: 12 }}>{opt.hint}</Text>}
              </div>
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>
    </div>
  )
}
