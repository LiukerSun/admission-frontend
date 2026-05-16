import { Card, Checkbox, Form, Input, InputNumber, Select, Typography } from 'antd'
import { HOLLAND_OPTIONS, type HollandLetter, composeHollandCode, decomposeHollandCode } from '@/utils/profileLabels'

const { Paragraph, Text } = Typography

// "Domain & background": geographic preferences, Holland interest code,
// family / career text fields, budget. All optional.
//
// The Holland field is special: backend stores a string like "RIA"; the UI
// surfaces six clickable cards (no letter codes). A small adapter on
// Form.Item.getValueProps + getValueFromEvent translates between them.
export default function RegionBackgroundSection() {
  return (
    <Form.Item noStyle>
      <Paragraph type="secondary" style={{ marginTop: 0 }}>
        告诉 AI 你的地域偏好、兴趣类型、家庭与职业规划等背景信息。这些会影响排序但不会强制过滤（不想学的城市除外）。
      </Paragraph>

      <Text strong style={{ display: 'block', marginBottom: 8 }}>地域偏好</Text>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Form.Item label="倾向城市" name={['preferences', 'preferred_cities']}>
          <Select
            mode="tags"
            placeholder="例如：哈尔滨、北京"
            tokenSeparators={[',', '，', ' ']}
            maxTagCount={16}
          />
        </Form.Item>
        <Form.Item label="排除城市" name={['preferences', 'excluded_cities']}>
          <Select
            mode="tags"
            placeholder="例如：某些气候不适合的城市"
            tokenSeparators={[',', '，', ' ']}
            maxTagCount={16}
          />
        </Form.Item>
        <Form.Item label="倾向省份" name={['preferences', 'preferred_provinces']}>
          <Select
            mode="tags"
            placeholder="例如：广东、浙江"
            tokenSeparators={[',', '，', ' ']}
            maxTagCount={16}
          />
        </Form.Item>
        <Form.Item label="排除省份" name={['preferences', 'excluded_provinces']}>
          <Select
            mode="tags"
            placeholder="例如：不希望去的省份"
            tokenSeparators={[',', '，', ' ']}
            maxTagCount={16}
          />
        </Form.Item>
      </div>

      <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>霍兰德职业兴趣（多选）</Text>
      <Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 12 }}>
        勾选你的兴趣类型，AI 会优先推荐对应方向的专业。
      </Paragraph>
      <Form.Item
        name={['preferences', 'holland_code']}
        getValueProps={(value: string | undefined) => ({
          value: decomposeHollandCode(value),
        })}
        getValueFromEvent={(letters: HollandLetter[] | unknown) =>
          composeHollandCode(Array.isArray(letters) ? (letters as HollandLetter[]) : [])
        }
      >
        <Checkbox.Group style={{ width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {HOLLAND_OPTIONS.map((opt) => (
              <Card
                key={opt.code}
                size="small"
                bodyStyle={{ padding: '8px 12px' }}
                style={{ borderRadius: 6 }}
              >
                <Checkbox value={opt.code}>
                  <div>
                    <Text strong>{opt.label}</Text>
                    {opt.hint && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{opt.hint}</Text>
                      </div>
                    )}
                  </div>
                </Checkbox>
              </Card>
            ))}
          </div>
        </Checkbox.Group>
      </Form.Item>

      <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>家庭与职业</Text>
      <Form.Item label="家庭可用资源" name={['preferences', 'family_resources']}>
        <Input.TextArea
          rows={2}
          maxLength={500}
          showCount
          placeholder="例如：父母在某行业，老家在某城市，亲戚学校资源等"
        />
      </Form.Item>
      <Form.Item label="家庭经济情况" name={['preferences', 'family_economy']}>
        <Input.TextArea
          rows={2}
          maxLength={500}
          showCount
          placeholder="例如：能承担每年学费上限，是否能去民办、中外合办等"
        />
      </Form.Item>
      <Form.Item label="职业规划" name={['preferences', 'career_plans']}>
        <Input.TextArea
          rows={2}
          maxLength={500}
          showCount
          placeholder="例如：未来想做工程师 / 老师 / 创业，要不要考研出国等"
        />
      </Form.Item>

      <Form.Item label="每年学费预算上限" name={['preferences', 'budget_tuition_max']} style={{ marginBottom: 0 }}>
        <InputNumber
          min={0}
          max={1000000}
          step={1000}
          placeholder="例如 30000"
          style={{ width: 240 }}
          addonAfter="元 / 年"
        />
      </Form.Item>
    </Form.Item>
  )
}
