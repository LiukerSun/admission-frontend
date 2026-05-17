import {
  Button,
  Card,
  Form,
  InputNumber,
  Radio,
  Select,
  Slider,
  Space,
  Tag,
  TreeSelect,
  Typography,
} from 'antd'
import { useMemo, useRef, useState } from 'react'

import type {
  FormFieldDef,
  FormFieldOption,
  FormSubmissionPayload,
  FormSubmissionValue,
  FormWidgetPayload,
} from './types'

type Props = {
  widgetId: string
  payload: Record<string, unknown>
  // 父组件负责把提交结果包成 user message 发出去。本组件不直接接触
  // SSE / fetch — 保持 widget 渲染层无副作用。
  // 第二个参数 ownerConversationId 是 widget 挂载时所属对话的 id；上层
  // 据此校验"提交时用户是否还在原对话"，避免切对话竞态导致表单提交
  // 落到错误对话上（典型 bug：用户切到欢迎页瞬间点了旧 widget 的提
  // 交按钮，handleSubmit 看到 convId=null 走"新建对话"分支）。
  onSubmit?: (submission: FormSubmissionPayload, ownerConversationId: number | null) => void
  // 历史回放时为已提交过的表单传 true，表单将以只读 + 灰色标记态呈现
  disabled?: boolean
  // 历史回放时如果已经知道用户当时选的值，传进来回显
  submittedValues?: Record<string, FormSubmissionValue>
  // 当前展示这张表单的对话 id；FormWidget 挂载时固化进 ref，之后 props
  // 变化（用户切对话引起的 rerender）不影响——保证提交结果带的永远是
  // 表单"诞生时"所属的对话 id。
  ownerConversationId?: number | null
}

const isFormPayload = (p: Record<string, unknown>): p is FormWidgetPayload =>
  typeof p === 'object' && p !== null && Array.isArray((p as { fields?: unknown }).fields)

// groupOptions 把扁平 options 按 group 字段聚合用于分组渲染。无 group
// 字段的散在一个 "" 桶里 —— 渲染时单独按"其它"或不带标题展示。
function groupOptions(options: FormFieldOption[]): Array<{ group: string; items: FormFieldOption[] }> {
  const buckets = new Map<string, FormFieldOption[]>()
  options.forEach((opt) => {
    const key = opt.group || ''
    const list = buckets.get(key)
    if (list) list.push(opt)
    else buckets.set(key, [opt])
  })
  return Array.from(buckets.entries()).map(([group, items]) => ({ group, items }))
}

export default function FormWidget({
  widgetId,
  payload,
  onSubmit,
  disabled,
  submittedValues,
  ownerConversationId = null,
}: Props) {
  const [form] = Form.useForm()
  const [submitted, setSubmitted] = useState(Boolean(disabled))
  // useRef 在挂载时取 ownerConversationId 的初值后**永不更新**。
  // 切对话引起的 props 变化不会影响这里——这是防御切对话竞态的关键。
  const ownerConvIdRef = useRef<number | null>(ownerConversationId)

  const data = isFormPayload(payload) ? payload : null

  // 历史回显：把 submittedValues 注入初始值。若没传则用各字段类型对应的空值。
  // 对支持整省勾选的字段：提交时按 target_param / province_target_param
  // 拆开存了，回显时合并回 TreeSelect 期望的统一 string[]（省份加上
  // 'province:' 前缀），SHOW_PARENT 策略让 UI 上只显示省级 tag。
  const initialValues = useMemo(() => {
    if (!data) return {}
    const init: Record<string, FormSubmissionValue> = {}
    data.fields.forEach((f) => {
      if (submittedValues) {
        if (f.type === 'multi_select' && f.province_target_param) {
          const cities = submittedValues[f.key]
          const provinces = submittedValues[f.province_target_param]
          const merged: string[] = []
          if (Array.isArray(cities)) {
            cities.forEach((c) => {
              if (typeof c === 'string') merged.push(c)
            })
          }
          if (Array.isArray(provinces)) {
            provinces.forEach((p) => {
              if (typeof p === 'string') merged.push(`province:${p}`)
            })
          }
          init[f.key] = merged
          return
        }
        if (f.key in submittedValues) {
          init[f.key] = submittedValues[f.key]
          return
        }
      }
      if (f.type === 'multi_select') init[f.key] = []
      // 其它类型不预填，避免 antd 把 undefined 当成已设。
    })
    return init
  }, [data, submittedValues])

  // fieldByKey 给 handleFinish 提供"字段元数据"查询入口——决定一个
  // 多选字段的某个 value 应该被分流到 target_param 还是 province_target_param。
  // 必须放在 !data 的 early return 之前，否则违反 react-hooks/rules-of-hooks
  // （Hook 调用顺序不能依赖运行时条件）。
  const fieldByKey = useMemo(() => {
    const m = new Map<string, FormFieldDef>()
    if (data) data.fields.forEach((f) => m.set(f.key, f))
    return m
  }, [data])

  if (!data) {
    return (
      <Card size="small">
        <Typography.Text type="secondary">表单数据格式异常</Typography.Text>
      </Card>
    )
  }

  const isLocked = submitted || disabled

  const handleFinishUnsafe = (raw: Record<string, FormSubmissionValue | undefined>) => {
    const values: Record<string, FormSubmissionValue> = {}

    Object.entries(raw).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      if (Array.isArray(v) && v.length === 0) return
      if (typeof v === 'string' && v.trim() === '') return

      const field = fieldByKey.get(k)
      // multi_select 支持整省勾选时：TreeSelect 提交的值里既可能有省级
      // 节点（标识符 = 'province:<group_code>'）也可能有城市值。这里
      // 按前缀拆分到 target_param vs province_target_param——后端拿到
      // form_submission 后直接 merge 到 RecommendationRequest 即可。
      if (
        field?.type === 'multi_select' &&
        field.province_target_param &&
        Array.isArray(v)
      ) {
        const cities: string[] = []
        const provinces: string[] = []
        v.forEach((entry) => {
          if (typeof entry !== 'string') return
          if (entry.startsWith('province:')) provinces.push(entry.slice('province:'.length))
          else cities.push(entry)
        })
        if (cities.length > 0) values[k] = cities
        if (provinces.length > 0) values[field.province_target_param] = provinces
        return
      }

      values[k] = v
    })

    setSubmitted(true)
    onSubmit?.({ form_id: widgetId, values }, ownerConvIdRef.current)
  }

  const handleFinish = handleFinishUnsafe

  return (
    <Card
      size="small"
      title={
        <Space>
          <span>{data.title}</span>
          {isLocked ? <Tag color="default">已提交</Tag> : null}
        </Space>
      }
    >
      {data.intro ? (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          {data.intro}
        </Typography.Paragraph>
      ) : null}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        disabled={isLocked}
      >
        {data.fields.map((field) => renderField(field))}

        {!isLocked ? (
          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button type="primary" htmlType="submit">
              {data.submit_label || '提交并继续'}
            </Button>
          </Form.Item>
        ) : null}
      </Form>
    </Card>
  )
}

function renderField(field: FormFieldDef) {
  switch (field.type) {
    case 'multi_select': {
      // 字段允许"整省勾选"且选项确实有 group_code（DB 加载的真实数据）
      // 时切到 TreeSelect。硬编码兜底列表没有 group_code，仍用扁平 Select。
      const allowProvinceCheck =
        !!field.province_target_param &&
        (field.options || []).some((o) => !!o.group_code)
      return (
        <Form.Item key={field.key} name={field.key} label={field.label} extra={field.helper}>
          {allowProvinceCheck
            ? renderRegionTreeSelect(field.options || [])
            : renderMultiSelect(field.options || [])}
        </Form.Item>
      )
    }
    case 'single_select':
      return (
        <Form.Item key={field.key} name={field.key} label={field.label} extra={field.helper}>
          <Radio.Group>
            <Space orientation="vertical" size={4}>
              {(field.options || []).map((opt) => (
                <Radio key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>
      )
    case 'number':
      return (
        <Form.Item key={field.key} name={field.key} label={field.label} extra={field.helper}>
          <NumberInputWithPresets field={field} />
        </Form.Item>
      )
    case 'slider': {
      const min = field.min ?? 0
      const max = field.max ?? 100
      const step = field.step ?? 1
      const marks: Record<number, string> = {}
      marks[min] = String(min)
      marks[max] = String(max)
      return (
        <Form.Item key={field.key} name={field.key} label={field.label} extra={field.helper}>
          <Slider min={min} max={max} step={step} marks={marks} />
        </Form.Item>
      )
    }
    default:
      return null
  }
}

// renderRegionTreeSelect 用 TreeSelect 渲染"省份 → 城市"两级树。
// 用户可以勾整省（提交时落到 province_target_param）或单个城市（落到
// target_param）。SHOW_PARENT 让"勾整省"的状态在已选标签里只显示
// 一个省份 tag，避免被一堆子城市 tag 撑爆——同时配合 onSubmit 拆分
// 逻辑，提交的也只是省级标识。
function renderRegionTreeSelect(options: FormFieldOption[]) {
  const grouped = groupOptions(options)
  // 整省节点的 value 用 'province:<group_code>' 前缀编码——避免和真实
  // 城市名（"哈尔滨"等）冲突，提交时 handleFinish 按前缀拆分。
  const treeData = grouped
    .filter(({ items }) => items.length > 0)
    .map(({ group, items }) => {
      const firstCode = items.find((it) => !!it.group_code)?.group_code
      // 没有 group_code 的分组（罕见：硬编码兜底）退化成纯叶子集合
      // 但不可勾父节点，避免落出无效 province 值。
      const provinceValue = firstCode ? `province:${firstCode}` : undefined
      return {
        title: group || '其它',
        value: provinceValue ?? `_grp:${group || 'other'}`,
        selectable: !!provinceValue, // 没 code 就只能勾叶子
        children: items.map((opt) => ({
          title: opt.label,
          value: opt.value,
        })),
      }
    })
  return (
    <TreeSelect
      multiple
      allowClear
      showSearch
      treeCheckable
      showCheckedStrategy={TreeSelect.SHOW_PARENT}
      treeNodeFilterProp="title"
      placeholder="点击勾选；勾父省 = 勾该省全部城市"
      style={{ width: '100%' }}
      maxTagCount="responsive"
      treeData={treeData}
    />
  )
}

// renderMultiSelect 用 antd Select 的多选模式：折叠成一行 + 支持搜索 +
// 已选项以标签呈现。选项按 group 字段聚合成 OptGroup，便于在下拉里
// 按"省内/华东/工科/医学"等区块浏览。
//
// 之所以不用 Checkbox.Group：城市/专业方向各 ~30 个选项铺开占整屏，一
// 张表单堆 3-4 个多选字段就会把对话流挤得没法看。Select 默认收起，
// 用户用搜索框直接输入关键词比逐项扫更快。
function renderMultiSelect(options: FormFieldOption[]) {
  const grouped = groupOptions(options)
  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      placeholder="点击选择或搜索…"
      style={{ width: '100%' }}
      // 按 label 模糊匹配。Select 默认拿 value 比对，但 value 是中文短词，
      // label 才是用户实际看到的文字（含括号说明）。
      optionFilterProp="label"
      maxTagCount="responsive"
      options={grouped.map(({ group, items }) => ({
        label: group || '其它',
        title: group || '其它',
        options: items.map((opt) => ({ label: opt.label, value: opt.value })),
      }))}
    />
  )
}

// NumberInputWithPresets 把 InputNumber 和"快捷档位"按钮组合在一起；
// 用户点击 preset 立即把表单值改成该数字，避免反复键入。
function NumberInputWithPresets({ field }: { field: FormFieldDef }) {
  // 受控适配：antd Form.Item 通过 value/onChange 注入；这里没用 props
  // 是因为我们直接借用 InputNumber 的 props 透传——简单点比"完全封装"更易读。
  return (
    <Space orientation="vertical" size={6} style={{ width: '100%' }}>
      <Form.Item name={field.key} noStyle>
        <InputNumber
          min={field.min}
          max={field.max}
          step={field.step}
          style={{ width: '100%' }}
        />
      </Form.Item>
      {field.presets && field.presets.length ? (
        <Space size={6} wrap>
          {field.presets.map((v) => (
            <PresetButton key={v} fieldKey={field.key} value={v} />
          ))}
        </Space>
      ) : null}
    </Space>
  )
}

function PresetButton({ fieldKey, value }: { fieldKey: string; value: number }) {
  const form = Form.useFormInstance()
  return (
    <Button size="small" onClick={() => form.setFieldValue(fieldKey, value)}>
      {value.toLocaleString()}
    </Button>
  )
}
