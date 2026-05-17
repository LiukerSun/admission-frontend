import { Form, InputNumber, Radio, Select, Tag, Typography } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import {
  ELECTIVE_SUBJECT_OPTIONS,
  REGION_OPTIONS,
  SUBJECT_CATEGORY_OPTIONS,
} from '@/utils/profileLabels'

const { Text } = Typography

const ELECTIVE_LIMIT = 2

// 设计 token（与 dashboard / index.css 对齐）
const C = {
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
  surface: '#FFFFFF',
  primary: '#1E40AF',
  primarySoft: '#EFF6FF',
  primarySofter: '#F1F5F9',
  danger: '#DC2626',
}

// 问卷的「核心信息」区。PR1 之后必填项瘦身到四项：
//   省份 + 首选科目 + 再选科目 4 选 2 + 总分
// 位次和目标院校专业组数移除：位次由后端按 (total_score, region, subject) 从一分一段表换算，
// 目标院校专业组数（即政策允许填的志愿数；1 个志愿 = 1 个院校专业组，含若干具体专业）
// 由后端按 (year, region, subject) 查 region_plan_size_map（缺失回退默认 40）。
export default function RequiredSection() {
  return (
    <div>
      <Form.Item
        label="所在省份"
        name="region_code"
        rules={[{ required: true, message: '请选择省份' }]}
        tooltip="目前 AI 仅支持部分省份。其它省份允许保存档案，等待算法支持。"
      >
        <Select
          size="large"
          placeholder="请选择高考所在省份"
          optionLabelProp="label"
          // 用单一 options API（删除 children 形式），避免渲染歧义；
          // optionRender 在 dropdown 里给未支持省份加 "即将开放" tag。
          options={REGION_OPTIONS.map((opt) => ({
            value: opt.code,
            label: opt.label,
            supported: opt.supported,
          }))}
          optionRender={(opt) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{opt.data.label}</span>
              {!opt.data.supported && (
                <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                  即将开放
                </Tag>
              )}
            </div>
          )}
        />
      </Form.Item>

      <Form.Item
        label="首选科目"
        name="subject_category_code"
        rules={[{ required: true, message: '请选择首选科目' }]}
        tooltip="新高考 3+1+2 模式中的「1」：物理类或历史类，二选一。"
      >
        <Radio.Group style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} optionType="button" buttonStyle="solid">
          {SUBJECT_CATEGORY_OPTIONS.map((opt) => (
            <Radio.Button
              key={opt.code}
              value={opt.code}
              style={{
                height: 56,
                lineHeight: '20px',
                padding: '8px 16px',
                textAlign: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Text strong style={{ color: 'inherit', fontSize: 14 }}>
                  {opt.label}
                </Text>
                {opt.hint && (
                  <Text style={{ color: 'inherit', fontSize: 12, opacity: 0.7 }}>
                    {opt.hint}
                  </Text>
                )}
              </div>
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>

      <Form.Item
        label="再选科目"
        name="elective_subjects"
        required
        rules={[
          {
            // 强制恰好选 2 个。控件上选满 2 个时其他选项会被禁用，
            // 这里的 validator 是提交前最后兜底。
            validator: (_, value: string[] | undefined) => {
              if (!value || value.length === 0) return Promise.reject(new Error('请选择 2 门再选科目'))
              if (value.length !== ELECTIVE_LIMIT) return Promise.reject(new Error('请选择恰好 2 门再选科目'))
              return Promise.resolve()
            },
          },
        ]}
        tooltip="新高考 3+1+2 模式中的「2」：从生物、化学、地理、政治中任选 2 门。"
        extra={
          <Text style={{ fontSize: 12, color: C.textSecondary }}>
            选满 2 门后，其余选项将自动禁用。
          </Text>
        }
      >
        <ElectiveSubjectsField />
      </Form.Item>

      <Form.Item
        label="高考总分"
        name="total_score"
        rules={[{ required: true, message: '请输入高考总分' }]}
        tooltip="位次将根据您的总分 + 省份 + 首选科目，由一分一段表自动换算，无需手动填写。"
        style={{ marginBottom: 0 }}
      >
        <InputNumber
          size="large"
          min={0}
          max={750}
          placeholder="0 - 750"
          style={{ width: '100%' }}
          addonAfter="分"
          inputMode="numeric"
        />
      </Form.Item>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// ElectiveSubjectsField 卡片式 4 选 2 控件。
//
// 设计要点：
//  - 每个选项是一张可点击的卡片（≥44px 高），整张卡是命中区，触摸友好。
//  - selected → 蓝色边框 + 浅蓝底 + 右上角对勾；disabled → 半透明灰，cursor not-allowed。
//  - 响应式：mobile 2 列、tablet+ 4 列。AntD 的 Form.Item 通过 value/onChange 直接绑定。
//  - 用 button[role=checkbox] 而不是 native input，方便统一样式与键盘 a11y。
// ────────────────────────────────────────────────────────────────
function ElectiveSubjectsField({
  value,
  onChange,
}: {
  value?: string[]
  onChange?: (next: string[]) => void
}) {
  const selected = value ?? []
  const limitReached = selected.length >= ELECTIVE_LIMIT

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange?.(selected.filter((c) => c !== code))
      return
    }
    if (limitReached) return
    onChange?.([...selected, code])
  }

  return (
    <div
      role="group"
      aria-label="再选科目，从四项中选 2 项"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}
      className="elective-subjects-grid"
    >
      {ELECTIVE_SUBJECT_OPTIONS.map((opt) => {
        const isSelected = selected.includes(opt.code)
        const isDisabled = limitReached && !isSelected
        return (
          <button
            key={opt.code}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            onClick={() => toggle(opt.code)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                toggle(opt.code)
              }
            }}
            disabled={isDisabled}
            style={{
              position: 'relative',
              minHeight: 48,
              padding: '12px 16px',
              borderRadius: 8,
              border: `1px solid ${isSelected ? C.primary : C.border}`,
              background: isSelected ? C.primarySoft : isDisabled ? C.primarySofter : C.surface,
              color: isDisabled ? C.textDisabled : isSelected ? C.primary : C.text,
              fontSize: 14,
              fontWeight: isSelected ? 600 : 500,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.6 : 1,
              transition: 'border-color 150ms ease, background-color 150ms ease, color 150ms ease',
              textAlign: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (isSelected || isDisabled) return
              e.currentTarget.style.borderColor = C.borderHover
            }}
            onMouseLeave={(e) => {
              if (isSelected || isDisabled) return
              e.currentTarget.style.borderColor = C.border
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(30, 64, 175, 0.2)`
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {opt.label}
            {isSelected && (
              <CheckOutlined
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  fontSize: 12,
                  color: C.primary,
                }}
                aria-hidden
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
