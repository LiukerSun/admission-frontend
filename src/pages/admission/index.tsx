import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Col,
  Grid,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import {
  admissionApi,
  type AdmissionLine,
} from '@/services/admission'

type AdmissionLineGroup = AdmissionLine & {
  key: string
  children?: AdmissionLineGroup[]
  nodeType: 'university' | 'group' | 'major'
  isGroupRow?: boolean
  isUniversityRow?: boolean
  groupLineCount?: number
  universityLineCount?: number
  universityGroupCount?: number
  groupUniversityCount?: number
}

function uniqueCount(lines: AdmissionLine[], selector: (line: AdmissionLine) => string | number | undefined) {
  return new Set(lines.map(selector).filter(Boolean)).size
}

function minNumeric(lines: AdmissionLine[], selector: (line: AdmissionLine) => number | undefined) {
  const values = lines.map(selector).filter((value): value is number => typeof value === 'number')
  return values.length ? Math.min(...values) : undefined
}

function matchesUniversity(line: AdmissionLine, query: string) {
  const keyword = query.trim().toLowerCase()
  if (!keyword) return true

  return [line.university_name, line.university_code]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(keyword))
}

function universityKey(line: AdmissionLine) {
  return String(line.university_id || line.university_code || 'unknown')
}

function groupKey(line: AdmissionLine) {
  return `${universityKey(line)}-${line.group_code || '未分组'}`
}

function groupLabel(line: AdmissionLine) {
  return line.group_code || '未分组'
}

function lineKey(line: AdmissionLine) {
  return String(
    line.university_major_line_id ||
      line.id ||
      `${universityKey(line)}-${line.group_code}-${line.local_major_code}-${line.admission_year}-${line.region_code}`
  )
}

function renderRemark(value?: string) {
  if (!value) return '-'

  return (
    <Tooltip title={value} placement="topLeft" overlayStyle={{ maxWidth: 560 }}>
      <Typography.Text className="admission-remark-text" ellipsis>
        {value}
      </Typography.Text>
    </Tooltip>
  )
}

function detailItem(label: string, value?: string | number | boolean) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="admission-detail-item" key={label}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text>{typeof value === 'boolean' ? (value ? '是' : '否') : value}</Typography.Text>
    </div>
  )
}

function hasValue(value?: string | number | boolean) {
  return value !== undefined && value !== null && value !== ''
}

function summaryTag(label: string, value?: string | number | boolean, color = 'blue') {
  if (!hasValue(value)) return null
  return (
    <Tag color={color} key={label}>
      {label}{typeof value === 'boolean' ? (value ? '是' : '否') : value}
    </Tag>
  )
}

function textBlock(label: string, value?: string) {
  if (!value) return null
  return (
    <div className="admission-detail-block" key={label}>
      <Typography.Text strong>{label}</Typography.Text>
      <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}>
        {value}
      </Typography.Paragraph>
    </div>
  )
}

function hasExpandedContent(row: AdmissionLineGroup) {
  if (row.isUniversityRow) {
    return hasValue(row.master_major_count) || hasValue(row.doctoral_major_count) ||
      hasValue(row.master_major_names) || hasValue(row.doctoral_major_names)
  }
  if (row.isGroupRow) {
    return [
      row.batch_remark,
      row.group_min_score,
      row.group_min_rank,
      row.equivalent_min_score_2024,
      row.equivalent_min_score_2023,
      row.equivalent_min_score_2022,
      row.subject_change_2024,
    ].some(hasValue)
  }
  return [
    row.discipline_category,
    row.first_level_discipline,
    row.fourth_round_subject_eval,
    row.double_first_class_subject,
    row.soft_major_grade,
    row.major_evaluation_score,
    row.major_rank,
    row.is_national_feature,
    row.corresponding_master_majors,
    row.corresponding_doctoral_majors,
    row.major_intro,
    row.training_goal,
    row.subject_study_requirement,
    row.main_courses,
    row.postgraduate_direction,
    row.employment_direction,
  ].some(hasValue)
}

function renderExtensionSummary(row: AdmissionLineGroup) {
  if (row.isUniversityRow) {
    const tags = [
      summaryTag('硕士', row.master_major_count, 'cyan'),
      summaryTag('博士', row.doctoral_major_count, 'purple'),
    ].filter(Boolean)
    return tags.length ? <Space size={[0, 4]} wrap>{tags}</Space> : '-'
  }

  if (row.isGroupRow) {
    const tags = [
      summaryTag('组低分', row.group_min_score, 'geekblue'),
      summaryTag('组位次', row.group_min_rank, 'geekblue'),
      summaryTag('24等位', row.equivalent_min_score_2024, 'gold'),
      summaryTag('选科变化 ', row.subject_change_2024, 'orange'),
    ].filter(Boolean)
    return tags.length ? <Space size={[0, 4]} wrap>{tags}</Space> : '-'
  }

  const tags = [
    summaryTag('', row.discipline_category, 'blue'),
    summaryTag('', row.first_level_discipline, 'cyan'),
    summaryTag('软科', row.soft_major_grade, 'green'),
    summaryTag('排名', row.major_rank, 'purple'),
    summaryTag('特色 ', row.is_national_feature, 'gold'),
  ].filter(Boolean)
  return tags.length ? <Space size={[0, 4]} wrap>{tags}</Space> : '-'
}

function renderExpandedRow(row: AdmissionLineGroup) {
  if (row.isUniversityRow) {
    return (
      <div className="admission-detail-panel">
        <Typography.Title level={5} className="admission-detail-title">院校硕博信息</Typography.Title>
        <div className="admission-detail-grid">
          {detailItem('硕士专业数量', row.master_major_count)}
          {detailItem('博士专业数量', row.doctoral_major_count)}
        </div>
        {textBlock('硕士专业', row.master_major_names)}
        {textBlock('博士专业', row.doctoral_major_names)}
      </div>
    )
  }

  if (row.isGroupRow) {
    return (
      <div className="admission-detail-panel">
        <Typography.Title level={5} className="admission-detail-title">专业组拓展信息</Typography.Title>
        <div className="admission-detail-grid">
          {detailItem('批次备注', row.batch_remark)}
          {detailItem('专业组最低分', row.group_min_score)}
          {detailItem('专业组最低位次', row.group_min_rank)}
          {detailItem('24年等位最低分', row.equivalent_min_score_2024)}
          {detailItem('23年等位最低分', row.equivalent_min_score_2023)}
          {detailItem('22年等位最低分', row.equivalent_min_score_2022)}
          {detailItem('24年选科情况', row.subject_change_2024)}
        </div>
      </div>
    )
  }

  return (
    <div className="admission-detail-panel">
      <Typography.Title level={5} className="admission-detail-title">专业画像</Typography.Title>
      <div className="admission-detail-grid">
        {detailItem('学科门类', row.discipline_category)}
        {detailItem('一级学科', row.first_level_discipline)}
        {detailItem('第四轮学科评估', row.fourth_round_subject_eval)}
        {detailItem('双一流学科', row.double_first_class_subject)}
        {detailItem('软科等级', row.soft_major_grade)}
        {detailItem('专业评价得分', row.major_evaluation_score)}
        {detailItem('专业排名', row.major_rank)}
        {detailItem('国家特色', row.is_national_feature)}
      </div>
      <Typography.Title level={5} className="admission-detail-title">专业说明</Typography.Title>
      {[
        textBlock('本校对应硕士专业', row.corresponding_master_majors),
        textBlock('本校对应博士专业', row.corresponding_doctoral_majors),
        textBlock('专业简介', row.major_intro),
        textBlock('培养目标', row.training_goal),
        textBlock('学科要求', row.subject_study_requirement),
        textBlock('本科主要课程', row.main_courses),
        textBlock('考研方向', row.postgraduate_direction),
        textBlock('就业方向', row.employment_direction),
      ]}
    </div>
  )
}

function buildAdmissionTree(lines: AdmissionLine[]): AdmissionLineGroup[] {
  const universities = new Map<string, AdmissionLine[]>()

  lines.forEach((line) => {
    const key = universityKey(line)
    universities.set(key, [...(universities.get(key) || []), line])
  })

  return Array.from(universities.entries()).map(([universityMapKey, universityLines]) => {
    const firstUniversityLine = universityLines[0]
    const groups = new Map<string, AdmissionLine[]>()

    universityLines.forEach((line) => {
      const key = groupKey(line)
      groups.set(key, [...(groups.get(key) || []), line])
    })

    const children = Array.from(groups.entries()).map(([groupMapKey, groupLines]) => {
      const firstGroupLine = groupLines[0]
      return {
        ...firstGroupLine,
        key: `group-${groupMapKey}`,
        id: firstGroupLine.id || firstGroupLine.university_major_line_id,
        local_major_name: `${groupLabel(firstGroupLine)} 专业组`,
        local_major_code: `${groupLines.length} 个招生专业`,
        university_major_line_id: undefined,
        children: groupLines.map((line) => ({
          ...line,
          key: `major-${lineKey(line)}`,
          nodeType: 'major' as const,
        })),
        nodeType: 'group' as const,
        isGroupRow: true,
        groupLineCount: groupLines.length,
        groupUniversityCount: uniqueCount(groupLines, (line) => line.university_id || line.university_code),
        admission_remark: groupMapKey,
      }
    })

    return {
      ...firstUniversityLine,
      key: `university-${universityMapKey}`,
      id: firstUniversityLine.id || firstUniversityLine.university_major_line_id,
      group_code: undefined,
      local_major_name: firstUniversityLine.university_name || '未知学校',
      local_major_code: `${universityLines.length} 个招生专业`,
      university_major_line_id: undefined,
      children,
      nodeType: 'university' as const,
      isUniversityRow: true,
      universityLineCount: universityLines.length,
      universityGroupCount: groups.size,
      admission_remark: universityMapKey,
    }
  })
}

export default function AdmissionPage() {
  const screens = Grid.useBreakpoint()
  const [lines, setLines] = useState<AdmissionLine[]>([])
  const [universityQuery, setUniversityQuery] = useState('')
  const [detailRow, setDetailRow] = useState<AdmissionLineGroup>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const res = await admissionApi.listAdmissionLines()
        if (cancelled) return
        setLines(res.data.data || [])
      } catch {
        if (!cancelled) message.error('招生数据加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const columns: ColumnsType<AdmissionLineGroup> = useMemo(
    () => [
      {
        title: '学校',
        dataIndex: 'university_name',
        fixed: screens.lg ? 'left' : undefined,
        width: 190,
        render: (name: string, row) => row.isUniversityRow ? (
          <Space direction="vertical" size={0}>
            <Typography.Text strong style={{ color: '#0F172A' }}>
              {name || '-'}
            </Typography.Text>
            <Typography.Text type="secondary">
              {row.universityGroupCount || 0} 个专业组 / {row.universityLineCount || 0} 个招生专业
            </Typography.Text>
          </Space>
        ) : (
          <Space direction="vertical" size={0}>
            <Typography.Text strong={row.isGroupRow} style={{ color: '#0F172A' }}>
              {name || '-'}
            </Typography.Text>
            <Typography.Text type="secondary">{row.university_code || '-'}</Typography.Text>
          </Space>
        ),
      },
      {
        title: '专业组',
        dataIndex: 'group_code',
        width: 96,
        render: (value: string, row) =>
          row.isUniversityRow ? '-' : <Tag color={row.isGroupRow ? 'geekblue' : 'blue'}>{value || '未分组'}</Tag>,
      },
      {
        title: '学校招生专业',
        dataIndex: 'local_major_name',
        width: 280,
        render: (name: string, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong={row.nodeType !== 'major'} style={{ color: '#0F172A' }}>
              {name || '-'}
            </Typography.Text>
            <Typography.Text type="secondary">{row.local_major_code || '-'}</Typography.Text>
          </Space>
        ),
      },
      {
        title: '拓展信息',
        width: 240,
        render: (_, row) => renderExtensionSummary(row),
      },
      {
        title: '详情',
        width: 86,
        fixed: screens.lg ? 'right' : undefined,
        render: (_, row) =>
          hasExpandedContent(row) ? (
            <Button
              size="small"
              type="link"
              icon={<InfoCircleOutlined />}
              onClick={(event) => {
                event.stopPropagation()
                setDetailRow(row)
              }}
            >
              查看
            </Button>
          ) : '-',
      },
      {
        title: '年份',
        dataIndex: 'admission_year',
        width: 86,
      },
      {
        title: '选科',
        dataIndex: 'subject_requirement_code',
        width: 140,
        render: (value: string) => value || '-',
      },
      {
        title: '计划',
        dataIndex: 'plan_count',
        width: 82,
        align: 'right',
        render: (value: number, row) => row.nodeType === 'major' ? value ?? '-' : '-',
      },
      {
        title: '最低分',
        dataIndex: 'min_score',
        width: 92,
        align: 'right',
        sorter: (a, b) => (a.min_score || 0) - (b.min_score || 0),
        render: (value: number, row) => {
          if (row.nodeType === 'major') return value ?? '-'
          if (row.isGroupRow) return row.group_min_score ?? '-'
          return '-'
        },
      },
      {
        title: '最低位次',
        dataIndex: 'min_rank',
        width: 110,
        align: 'right',
        sorter: (a, b) => (a.min_rank || 0) - (b.min_rank || 0),
        render: (value: number, row) => {
          if (row.nodeType === 'major') return value ?? '-'
          if (row.isGroupRow) return row.group_min_rank ?? '-'
          return '-'
        },
      },
      {
        title: '学费',
        dataIndex: 'tuition',
        width: 96,
        align: 'right',
        render: (value: number, row) => row.nodeType === 'major' ? value ?? '-' : '-',
      },
      {
        title: '备注',
        dataIndex: 'admission_remark',
        width: 280,
        ellipsis: true,
        render: (value: string, row) => {
          if (row.isUniversityRow) return `${row.universityGroupCount || 0} 个专业组`
          if (row.isGroupRow) return `${row.groupLineCount || 0} 条记录`
          return renderRemark(value)
        },
      },
    ],
    [screens.lg]
  )

  const filteredLines = useMemo(
    () => lines.filter((line) => matchesUniversity(line, universityQuery)),
    [lines, universityQuery]
  )

  const groupedLines = useMemo(() => buildAdmissionTree(filteredLines), [filteredLines])

  const stats = useMemo(() => {
    const bestRank = minNumeric(filteredLines, (line) => line.min_rank)
    const bestScore = minNumeric(filteredLines, (line) => line.min_score)
    return {
      lineCount: filteredLines.length,
      universityCount: uniqueCount(filteredLines, (line) => line.university_id || line.university_code),
      groupCount: uniqueCount(filteredLines, (line) => `${line.university_id}-${line.group_code}`),
      bestRank,
      bestScore,
    }
  }, [filteredLines])

  const refreshLines = async () => {
    setLoading(true)
    try {
      const res = await admissionApi.listAdmissionLines()
      setLines(res.data.data || [])
    } catch {
      message.error('招生数据查询失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admission-page">
      <section className="admission-interest-panel">
        <div className="admission-interest-copy">
          <Tag icon={<TagsOutlined />} color="blue">全部招生数据</Tag>
          <Typography.Title level={2} className="admission-interest-title">
            按专业组查看学校招生专业
          </Typography.Title>
          <Typography.Text type="secondary">
            当前接口先返回全部学校招生专业，前端仅按学校名称或院校代码搜索展示，并按学校专业组归类。
          </Typography.Text>
        </div>
        <Input
          className="admission-university-search"
          size="large"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索学校名称或院校代码"
          value={universityQuery}
          onChange={(event) => setUniversityQuery(event.target.value)}
        />
      </section>

      <Row gutter={[16, 16]} className="admission-stat-row">
        <Col xs={12} md={6}>
          <Statistic title="招生专业" value={stats.lineCount} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="可选学校" value={stats.universityCount} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="涉及专业组" value={stats.groupCount} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="最好位次" value={stats.bestRank ?? '-'} suffix={stats.bestScore ? `/${stats.bestScore}分` : undefined} />
        </Col>
      </Row>

      <div className="admission-result-header">
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            全部学校专业
          </Typography.Title>
          <Typography.Text type="secondary">结果展示学校发布的招生专业名称，不用 CHSI 名称覆盖学校原始名称。</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void refreshLines()} loading={loading}>
          刷新结果
        </Button>
      </div>

      <Table
        rowKey={(row) => row.key}
        loading={loading}
        columns={columns}
        dataSource={groupedLines}
        size="middle"
        scroll={{ x: 1720 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        open={Boolean(detailRow)}
        title={detailRow?.isUniversityRow ? '院校拓展信息' : detailRow?.isGroupRow ? '专业组拓展信息' : '专业拓展信息'}
        footer={null}
        width={860}
        onCancel={() => setDetailRow(undefined)}
      >
        {detailRow ? renderExpandedRow(detailRow) : null}
      </Modal>
    </div>
  )
}
