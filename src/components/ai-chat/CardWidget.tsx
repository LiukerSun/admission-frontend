import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Card, Empty, Image, Space, Statistic, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

type Metric = {
  label: string
  value: string | number
  suffix?: string
  prefix?: string
}

type Payload = {
  title?: string
  cover?: string
  description?: string
  tags?: unknown
  metrics?: unknown
  link?: string
  trend?: 'up' | 'down'
}

type Props = {
  payload: Record<string, unknown>
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function CardWidget({ payload }: Props) {
  const data = payload as Payload
  const [imageFailed, setImageFailed] = useState(false)

  const tags = useMemo(() => {
    if (!Array.isArray(data.tags)) return []
    return data.tags.filter((t): t is string => typeof t === 'string').slice(0, 8)
  }, [data.tags])

  const metrics = useMemo(() => {
    if (!Array.isArray(data.metrics)) return []
    return data.metrics
      .filter((m): m is Metric => !!m && typeof m === 'object' && 'label' in m && 'value' in m)
      .slice(0, 6)
  }, [data.metrics])

  const titleNode = data.link && isSafeHttpUrl(data.link) ? (
    <a href={data.link} target="_blank" rel="noopener noreferrer">
      {data.title || '卡片'}
    </a>
  ) : (
    data.title || '卡片'
  )

  const coverNode =
    data.cover && !imageFailed ? (
      <Image
        src={data.cover}
        alt={typeof data.title === 'string' ? data.title : 'cover'}
        preview={false}
        onError={() => setImageFailed(true)}
        style={{ width: '100%', height: 180, objectFit: 'cover' }}
      />
    ) : data.cover ? (
      <div style={{ padding: 16 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="图片加载失败" />
      </div>
    ) : null

  return (
    <Card
      size="small"
      title={titleNode}
      cover={coverNode}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {data.description ? (
          <Typography.Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 3 }}>
            {data.description}
          </Typography.Paragraph>
        ) : null}

        {tags.length ? (
          <div>
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        ) : null}

        {metrics.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {metrics.map((m) => (
              <Statistic
                key={m.label}
                title={m.label}
                value={m.value}
                suffix={m.suffix}
                prefix={m.prefix}
                valueStyle={{ fontSize: 16 }}
              />
            ))}
          </div>
        ) : null}

        {data.trend ? (
          <div style={{ color: data.trend === 'up' ? '#52c41a' : '#ff4d4f' }}>
            {data.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          </div>
        ) : null}
      </Space>
    </Card>
  )
}

