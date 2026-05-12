import { useState } from 'react'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  recommendationApi,
  type RecommendationItem,
  type RecommendationRequest,
  type RecommendationResponse,
} from '@/services/recommendation'

const { Title, Paragraph, Text } = Typography

// MVP：黑龙江物理类默认。城市/专业偏好用逗号分隔输入，避免一次性引入 tag input 组件。
const splitList = (value: string | undefined): string[] | undefined => {
  if (!value) return undefined
  const parts = value
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length ? parts : undefined
}

interface FormValues {
  region_code: string
  subject_category_code: 'physics' | 'history'
  total_score: number
  provincial_rank: number
  math_score?: number
  physics_score?: number
  chinese_score?: number
  english_score?: number
  preferred_majors_csv?: string
  preferred_cities_csv?: string
  excluded_keywords_csv?: string
  priority_strategy?: 'auto' | 'school' | 'major'
  plan_size?: number
}

const TIER_LABEL: Record<RecommendationItem['tier'], string> = {
  rush: '冲',
  match: '稳',
  safe: '保',
}

const TIER_COLOR: Record<RecommendationItem['tier'], string> = {
  rush: 'red',
  match: 'blue',
  safe: 'green',
}

function buildColumns(): ColumnsType<RecommendationItem> {
  return [
    { title: '#', dataIndex: 'order', width: 50, align: 'center' },
    {
      title: '档位',
      dataIndex: 'tier',
      width: 70,
      align: 'center',
      render: (tier: RecommendationItem['tier']) => (
        <Tag color={TIER_COLOR[tier]}>{TIER_LABEL[tier]}</Tag>
      ),
    },
    {
      title: '院校',
      dataIndex: 'university_name',
      render: (name: string, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Space size={4}>
            {row.is_985 && <Tag color="gold">985</Tag>}
            {row.is_211 && <Tag color="orange">211</Tag>}
            {row.is_double_first_class && <Tag color="purple">双一流</Tag>}
            {row.city && <Tag>{row.city}</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: '专业',
      dataIndex: 'local_major_name',
      render: (name: string, row) => (
        <Space direction="vertical" size={0}>
          <span>{name}</span>
          {row.discipline_category && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.discipline_category}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '组/批',
      width: 110,
      render: (_: unknown, row) => (
        <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
          <span>组 {row.group_code}</span>
          <Text type="secondary">{row.batch_code}</Text>
        </Space>
      ),
    },
    {
      title: '历史最低',
      width: 110,
      align: 'right',
      render: (_: unknown, row) => (
        <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
          <span>{row.historical_min_score ?? '—'} 分</span>
          <Text type="secondary">位 {row.historical_min_rank ?? '—'}</Text>
        </Space>
      ),
    },
    {
      title: '概率',
      dataIndex: 'probability',
      width: 90,
      align: 'right',
      render: (p: number) => `${(p * 100).toFixed(0)}%`,
    },
    {
      title: '推荐理由',
      dataIndex: 'reason',
      render: (reason: string, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>{reason}</span>
          {row.warnings?.length ? (
            <Text type="warning" style={{ fontSize: 12 }}>
              ⚠ {row.warnings.join('；')}
            </Text>
          ) : null}
        </Space>
      ),
    },
  ]
}

export default function RecommendationPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<RecommendationResponse | null>(null)

  const handleSubmit = async (values: FormValues) => {
    const payload: RecommendationRequest = {
      region_code: values.region_code,
      subject_category_code: values.subject_category_code,
      total_score: values.total_score,
      provincial_rank: values.provincial_rank,
      math_score: values.math_score,
      physics_score: values.physics_score,
      chinese_score: values.chinese_score,
      english_score: values.english_score,
      preferred_majors: splitList(values.preferred_majors_csv),
      preferred_cities: splitList(values.preferred_cities_csv),
      excluded_keywords: splitList(values.excluded_keywords_csv),
      priority_strategy: values.priority_strategy,
      plan_size: values.plan_size,
    }
    setLoading(true)
    try {
      const res = await recommendationApi.recommend(payload)
      if (res.data.code !== 0 || !res.data.data) {
        message.error(res.data.message || '推荐失败')
        return
      }
      setResp(res.data.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const grouped = resp
    ? {
        rush: resp.items.filter((i) => i.tier === 'rush'),
        match: resp.items.filter((i) => i.tier === 'match'),
        safe: resp.items.filter((i) => i.tier === 'safe'),
      }
    : null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          志愿推荐
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          基于你的位次、单科成绩、专业 / 城市偏好生成 ≤40 条冲/稳/保志愿表。
          推荐结果同步算法的五维评分（city / school / major / ability / future）。
        </Paragraph>
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            region_code: '230000',
            subject_category_code: 'physics',
            plan_size: 40,
            priority_strategy: 'auto',
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="生源地" name="region_code" rules={[{ required: true }]}>
                <Input placeholder="230000（黑龙江）" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="选科" name="subject_category_code" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'physics', label: '物理类' },
                    { value: 'history', label: '历史类' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="总分" name="total_score" rules={[{ required: true }]}>
                <InputNumber min={0} max={750} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="省内位次" name="provincial_rank" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Form.Item label="数学" name="math_score">
                <InputNumber min={0} max={150} style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="物理" name="physics_score">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="语文" name="chinese_score">
                <InputNumber min={0} max={150} style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="英语" name="english_score">
                <InputNumber min={0} max={150} style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="偏好专业"
                name="preferred_majors_csv"
                tooltip="逗号或空格分隔。例：计算机, 软件, 人工智能"
              >
                <Input placeholder="计算机, 软件" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="偏好城市"
                name="preferred_cities_csv"
                tooltip="逗号或空格分隔。例：北京, 上海, 杭州"
              >
                <Input placeholder="北京, 上海" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="排除关键字"
                name="excluded_keywords_csv"
                tooltip="如 化学、生化环材、生物"
              >
                <Input placeholder="生化环材" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Form.Item label="策略" name="priority_strategy">
                <Select
                  options={[
                    { value: 'auto', label: '自动' },
                    { value: 'school', label: '学校优先' },
                    { value: 'major', label: '专业优先' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="志愿数" name="plan_size">
                <InputNumber min={1} max={40} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              生成推荐
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {resp && grouped ? (
        <Card>
          <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
            <Space wrap>
              <Tag color="blue">策略：{resp.strategy === 'school' ? '学校优先' : '专业优先'}</Tag>
              <Text type="secondary">{resp.strategy_reason}</Text>
            </Space>
            <Space wrap size="small">
              <Tag color={TIER_COLOR.rush}>冲 {resp.rush_count}</Tag>
              <Tag color={TIER_COLOR.match}>稳 {resp.match_count}</Tag>
              <Tag color={TIER_COLOR.safe}>保 {resp.safe_count}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                位次窗口：冲 [{resp.rank_window.rush_min}–{resp.rank_window.rush_max}] · 稳 [
                {resp.rank_window.match_min}–{resp.rank_window.match_max}] · 保 [
                {resp.rank_window.safe_min}–{resp.rank_window.safe_max}]
              </Text>
            </Space>
            {resp.notes?.map((note, i) => (
              <Text key={i} type="warning" style={{ fontSize: 13 }}>
                · {note}
              </Text>
            ))}
            {resp.llm_summary ? (
              <Card size="small" type="inner" title="AI 复核">
                {resp.llm_summary}
              </Card>
            ) : null}
          </Space>

          <Tabs
            defaultActiveKey="all"
            items={[
              {
                key: 'all',
                label: `全部 (${resp.items.length})`,
                children: (
                  <Table<RecommendationItem>
                    columns={buildColumns()}
                    dataSource={resp.items}
                    rowKey={(r) => `${r.order}-${r.university_code}-${r.local_major_code}`}
                    pagination={false}
                    size="small"
                  />
                ),
              },
              ...(['rush', 'match', 'safe'] as const).map((tier) => ({
                key: tier,
                label: `${TIER_LABEL[tier]} (${grouped[tier].length})`,
                children: (
                  <Table<RecommendationItem>
                    columns={buildColumns()}
                    dataSource={grouped[tier]}
                    rowKey={(r) => `${r.order}-${r.university_code}-${r.local_major_code}`}
                    pagination={false}
                    size="small"
                  />
                ),
              })),
            ]}
          />
        </Card>
      ) : null}
    </Space>
  )
}
