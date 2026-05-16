import { Alert, Form, InputNumber, Radio, Select, Tag, Typography } from 'antd'
import {
  REGION_OPTIONS,
  SUBJECT_CATEGORY_OPTIONS,
} from '@/utils/profileLabels'

const { Text, Paragraph } = Typography

// The first / always-expanded card. These four fields plus plan_size cover the
// AI agent's required "基本盘"; once they're filled the questionnaire flips to
// "已完成" and the AI can pre-fill new conversations.
export default function RequiredSection() {
  return (
    <div>
      <Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 16 }}>
        以下四项是 AI 智能填报必须的核心信息。填好这四项 + 目标志愿数即可视为完成；其余分区都是可选的，越完整 AI 推荐越精准。
      </Paragraph>

      <Form.Item
        label="所在省份"
        name="region_code"
        rules={[{ required: true, message: '请选择省份' }]}
        tooltip="目前 AI 仅支持部分省份。其它省份允许保存档案，等待算法支持。"
      >
        <Select
          placeholder="请选择高考所在省份"
          optionLabelProp="label"
          options={REGION_OPTIONS.map((opt) => ({
            value: opt.code,
            label: opt.label,
            disabled: false,
          }))}
        >
          {REGION_OPTIONS.map((opt) => (
            <Select.Option key={opt.code} value={opt.code} label={opt.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{opt.label}</span>
                {!opt.supported && <Tag color="default">即将开放</Tag>}
              </div>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="选科类别"
        name="subject_category_code"
        rules={[{ required: true, message: '请选择选科类别' }]}
      >
        <Radio.Group>
          {SUBJECT_CATEGORY_OPTIONS.map((opt) => (
            <Radio.Button key={opt.code} value={opt.code} style={{ minWidth: 140, textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0' }}>
                <Text strong>{opt.label}</Text>
                {opt.hint && <Text type="secondary" style={{ fontSize: 12 }}>{opt.hint}</Text>}
              </div>
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item
          label="高考总分"
          name="total_score"
          rules={[{ required: true, message: '请输入高考总分' }]}
        >
          <InputNumber min={0} max={750} placeholder="0 - 750" style={{ width: '100%' }} addonAfter="分" />
        </Form.Item>

        <Form.Item
          label="省内位次"
          name="provincial_rank"
          rules={[{ required: true, message: '请输入省内位次' }]}
          tooltip="位次比分数更稳定，AI 会优先按位次匹配"
        >
          <InputNumber min={0} max={500000} placeholder="例如 4500" style={{ width: '100%' }} addonAfter="名" />
        </Form.Item>
      </div>

      <Form.Item
        label="目标志愿数"
        name="plan_size"
        tooltip="未填写时默认 40（部分省份新高考最大值）"
      >
        <InputNumber min={1} max={96} placeholder="40" style={{ width: 200 }} addonAfter="个" />
      </Form.Item>

      <Alert
        type="info"
        showIcon
        message="一次填好，下次省心"
        description="保存后，在「智能填报」开新对话时 AI 会自动读取这些信息，无需再次输入。修改本页只会影响之后的新对话。"
        style={{ marginTop: 8 }}
      />
    </div>
  )
}
