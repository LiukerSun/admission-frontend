import { Button, Card, InputNumber, Select, Space, Switch, Typography } from 'antd'
import { EditOutlined } from '@ant-design/icons'

const { Text } = Typography

export type RecommendationSnapshot = {
  region_code: string
  subject_category_code?: 'physics' | 'history'
  total_score?: number
  provincial_rank?: number
  priority_strategy?: 'auto' | 'school' | 'major'
  enable_llm_tuning?: boolean
  plan_size?: number
}

type Props = {
  snapshot: RecommendationSnapshot
  editing: boolean
  onToggleEditing: () => void
  onChange: (next: Partial<RecommendationSnapshot>, touched: (keyof RecommendationSnapshot)[]) => void
  onGenerate: () => void
  canGenerate: boolean
  disabled: boolean
  showPreview: boolean
  previewLoading: boolean
  onPreview: () => void
}

export default function RecommendationPromptCard({
  snapshot,
  editing,
  onToggleEditing,
  onChange,
  onGenerate,
  canGenerate,
  disabled,
  showPreview,
  previewLoading,
  onPreview,
}: Props) {
  const subjectLabel = snapshot.subject_category_code === 'physics' ? '物理' : snapshot.subject_category_code === 'history' ? '历史' : '待收集'
  const priorityLabel =
    snapshot.priority_strategy === 'school' ? '院校优先' : snapshot.priority_strategy === 'major' ? '专业优先' : '自动'

  return (
    <Card
      size="small"
      title="志愿方案信息"
      extra={
        <Button type="text" size="small" icon={<EditOutlined />} onClick={onToggleEditing} disabled={disabled} />
      }
      styles={{ body: { padding: 12 } }}
    >
      <Space direction="vertical" size={10} style={{ width: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Text type="secondary">地区</Text>
          <Text>黑龙江(230000)</Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Text type="secondary">科类</Text>
          {editing ? (
            <Select
              style={{ width: 140 }}
              placeholder="科类"
              value={snapshot.subject_category_code}
              options={[
                { label: '物理', value: 'physics' },
                { label: '历史', value: 'history' },
              ]}
              onChange={(v) => onChange({ subject_category_code: v as 'physics' | 'history' }, ['subject_category_code'])}
            />
          ) : (
            <Text>{subjectLabel}</Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Text type="secondary">分数</Text>
          {editing ? (
            <InputNumber
              style={{ width: 140 }}
              placeholder="分数"
              min={0}
              value={snapshot.total_score}
              onChange={(v) => onChange({ total_score: typeof v === 'number' ? v : undefined }, ['total_score'])}
            />
          ) : (
            <Text>{snapshot.total_score ? String(snapshot.total_score) : '待收集'}</Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Text type="secondary">位次</Text>
          {editing ? (
            <InputNumber
              style={{ width: 140 }}
              placeholder="位次"
              min={0}
              value={snapshot.provincial_rank}
              onChange={(v) => onChange({ provincial_rank: typeof v === 'number' ? v : undefined }, ['provincial_rank'])}
            />
          ) : (
            <Text>{snapshot.provincial_rank ? String(snapshot.provincial_rank) : '待收集'}</Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Text type="secondary">策略</Text>
          {editing ? (
            <Select
              style={{ width: 140 }}
              placeholder="院校/专业优先"
              value={snapshot.priority_strategy || 'auto'}
              options={[
                { label: '自动', value: 'auto' },
                { label: '院校优先', value: 'school' },
                { label: '专业优先', value: 'major' },
              ]}
              onChange={(v) => onChange({ priority_strategy: v as 'auto' | 'school' | 'major' }, ['priority_strategy'])}
            />
          ) : (
            <Text>{priorityLabel}</Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Text type="secondary">条数</Text>
          {editing ? (
            <InputNumber
              style={{ width: 140 }}
              min={1}
              max={500}
              value={snapshot.plan_size ?? 40}
              onChange={(v) => onChange({ plan_size: typeof v === 'number' ? v : undefined }, ['plan_size'])}
            />
          ) : (
            <Text>{String(snapshot.plan_size ?? 40)}</Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <Text type="secondary">LLM调优</Text>
          {editing ? (
            <Switch
              checked={!!snapshot.enable_llm_tuning}
              onChange={(checked) => onChange({ enable_llm_tuning: checked }, ['enable_llm_tuning'])}
            />
          ) : (
            <Text>{snapshot.enable_llm_tuning ? '开启' : '关闭'}</Text>
          )}
        </div>

        <Button type="primary" onClick={onGenerate} disabled={!canGenerate || disabled} block>
          生成志愿方案
        </Button>
        {showPreview ? (
          <Button onClick={onPreview} loading={previewLoading} disabled={disabled} block>
            查看生成结果
          </Button>
        ) : null}
      </Space>
    </Card>
  )
}
