import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Input,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, SearchOutlined, TagsOutlined } from '@ant-design/icons'
import {
  admissionApi,
  type AdmissionLine,
  type DictionaryItem,
  type DictionaryResponse,
  type University,
  type UniversityListQuery,
} from '@/services/admission'
import AdmissionDetailTable from './AdmissionDetailTable'

type RecommendationTab = 'list' | 'admission'

type TriBool = '' | '1' | '0'

const TIER_OPTIONS: Array<{ label: string; value: keyof UniversityListQuery }> = [
  { label: '985', value: 'is_985' },
  { label: '211', value: 'is_211' },
  { label: '双一流', value: 'is_double_first_class' },
  { label: '国家重点', value: 'is_national_key' },
  { label: '省属重点', value: 'is_provincial_key' },
]

function buildTierText(u: University): string {
  const tags: string[] = []
  if (u.is_985) tags.push('985')
  if (u.is_211) tags.push('211')
  if (u.is_double_first_class) tags.push('双一流')
  if (u.is_national_key) tags.push('国家重点')
  if (u.is_provincial_key) tags.push('省属重点')
  return tags.length ? tags.join(' / ') : '-'
}

export default function UniversitySearchPage() {
  const navigate = useNavigate()
  const [dictionaries, setDictionaries] = useState<DictionaryResponse | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [admissionLines, setAdmissionLines] = useState<AdmissionLine[]>([])
  const [loading, setLoading] = useState(false)
  const [admissionLoading, setAdmissionLoading] = useState(false)
  const [tab, setTab] = useState<RecommendationTab>('list')

  // P0+P1 filter state
  const [query, setQuery] = useState('')
  const [tiers, setTiers] = useState<Array<keyof UniversityListQuery>>([])
  const [regionCodes, setRegionCodes] = useState<string[]>([])
  const [schoolCategoryCodes, setSchoolCategoryCodes] = useState<string[]>([])
  const [ownershipTypeCodes, setOwnershipTypeCodes] = useState<string[]>([])
  const [educationLevelCode, setEducationLevelCode] = useState<string>('')
  const [hasPostgraduateRecommendation, setHasPostgraduateRecommendation] = useState<TriBool>('')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await admissionApi.listDictionaries()
        if (!cancelled) setDictionaries(res.data.data || null)
      } catch {
        if (!cancelled) message.error('字典加载失败')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const filterParams = useMemo<UniversityListQuery>(() => {
    const params: UniversityListQuery = {
      q: query.trim() || undefined,
      region_codes: regionCodes.length ? regionCodes : undefined,
      school_category_codes: schoolCategoryCodes.length ? schoolCategoryCodes : undefined,
      ownership_type_codes: ownershipTypeCodes.length ? ownershipTypeCodes : undefined,
      education_level_code: educationLevelCode || undefined,
    }
    TIER_OPTIONS.forEach(({ value }) => {
      if (tiers.includes(value)) {
        ;(params as Record<string, unknown>)[value] = true
      }
    })
    if (hasPostgraduateRecommendation === '1') params.has_postgraduate_recommendation = true
    else if (hasPostgraduateRecommendation === '0') params.has_postgraduate_recommendation = false
    return params
  }, [
    query,
    regionCodes,
    schoolCategoryCodes,
    ownershipTypeCodes,
    educationLevelCode,
    tiers,
    hasPostgraduateRecommendation,
  ])

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await admissionApi.listUniversities(filterParams)
        if (cancelled) return
        setUniversities(res.data.data || [])
      } catch {
        if (cancelled) return
        message.error('院校检索失败')
        setUniversities([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [filterParams, refreshKey])

  const refreshUniversities = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const ADMISSION_BATCH_LIMIT = 100

  const universityIds = useMemo(
    () => universities.map((u) => u.id).filter((id): id is number => typeof id === 'number'),
    [universities]
  )

  const admissionOverLimit = universityIds.length > ADMISSION_BATCH_LIMIT

  useEffect(() => {
    if (tab !== 'admission') return
    let cancelled = false
    const run = async () => {
      if (admissionOverLimit || universityIds.length === 0) {
        if (!cancelled) setAdmissionLines([])
        return
      }
      setAdmissionLoading(true)
      try {
        const res = await admissionApi.listAdmissionLines({
          university_ids: universityIds.join(','),
        })
        if (!cancelled) setAdmissionLines(res.data.data || [])
      } catch {
        if (!cancelled) message.error('招生明细加载失败')
      } finally {
        if (!cancelled) setAdmissionLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [tab, universityIds, admissionOverLimit])

  const stats = useMemo(() => {
    const total = universities.length
    const c985 = universities.filter((u) => u.is_985).length
    const c211 = universities.filter((u) => u.is_211).length
    const cDouble = universities.filter((u) => u.is_double_first_class).length
    return { total, c985, c211, cDouble }
  }, [universities])

  const handleClearFilters = () => {
    setQuery('')
    setTiers([])
    setRegionCodes([])
    setSchoolCategoryCodes([])
    setOwnershipTypeCodes([])
    setEducationLevelCode('')
    setHasPostgraduateRecommendation('')
  }

  const regionOptions = useMemo(
    () =>
      (dictionaries?.regions || []).map((item: DictionaryItem) => ({
        value: item.code,
        label: item.name,
      })),
    [dictionaries]
  )

  const schoolCategoryOptions = useMemo(
    () =>
      (dictionaries?.school_categories || []).map((item: DictionaryItem) => ({
        value: item.code,
        label: item.name,
      })),
    [dictionaries]
  )

  const ownershipOptions = useMemo(
    () =>
      (dictionaries?.school_ownership_types || []).map((item: DictionaryItem) => ({
        label: item.name,
        value: item.code,
      })),
    [dictionaries]
  )

  const educationLevelOptions = useMemo(
    () =>
      (dictionaries?.education_levels || []).map((item: DictionaryItem) => ({
        label: item.name,
        value: item.code,
      })),
    [dictionaries]
  )

  const columns: ColumnsType<University> = useMemo(
    () => [
      {
        title: '学校',
        dataIndex: 'name',
        width: 220,
        fixed: 'left',
        render: (name: string, row) => (
          <Space orientation="vertical" size={0}>
            <Typography.Text strong style={{ color: '#0F172A' }}>
              {name}
            </Typography.Text>
            <Typography.Text type="secondary">代码: {row.university_code || '-'}</Typography.Text>
          </Space>
        ),
      },
      {
        title: '地区',
        dataIndex: 'region_name',
        width: 140,
        render: (value: string, row) => {
          const parts = [value, row.city].filter(Boolean)
          return parts.length ? parts.join(' · ') : '-'
        },
      },
      {
        title: '院校层次',
        key: 'tier',
        width: 160,
        render: (_, row) => buildTierText(row),
      },
      {
        title: '学校类型',
        dataIndex: 'school_category_name',
        width: 110,
        render: (value: string) => value || '-',
      },
      {
        title: '办学性质',
        dataIndex: 'ownership_type_name',
        width: 110,
        render: (value: string) => value || '-',
      },
      {
        title: '办学层次',
        dataIndex: 'education_level_name',
        width: 110,
        render: (value: string) => value || '-',
      },
      {
        title: '保研',
        dataIndex: 'has_postgraduate_recommendation',
        width: 90,
        render: (value?: boolean) =>
          value === undefined ? '-' : value ? <Tag color="green">有</Tag> : <Tag>无</Tag>,
      },
      {
        title: '硕博点',
        key: 'programs',
        width: 130,
        sorter: (a, b) =>
          (a.master_program_count || 0) + (a.doctoral_program_count || 0) -
          ((b.master_program_count || 0) + (b.doctoral_program_count || 0)),
        render: (_, row) => {
          const master = row.master_program_count
          const doctoral = row.doctoral_program_count
          if (master === undefined && doctoral === undefined) return '-'
          return `硕 ${master ?? '-'} / 博 ${doctoral ?? '-'}`
        },
      },
      {
        title: '软科排名',
        dataIndex: 'soft_rank',
        width: 110,
        sorter: (a, b) => Number(a.soft_rank || 9999) - Number(b.soft_rank || 9999),
        render: (value: string) => value || '-',
      },
      {
        title: '操作',
        key: 'action',
        width: 90,
        fixed: 'right',
        render: (_, row) => (
          <Button type="link" onClick={() => row.id && navigate(`/university/${row.id}`)}>
            详情
          </Button>
        ),
      },
    ],
    [navigate]
  )

  return (
    <div className="admission-page">
      <section className="admission-interest-panel">
        <div className="admission-interest-copy">
          <Tag icon={<TagsOutlined />} color="blue">院校检索</Tag>
          <Typography.Title level={2} className="admission-interest-title">
            按层次、地区、类型筛选院校
          </Typography.Title>
          <Typography.Text type="secondary">
            通过 985 / 211 / 双一流 等核心标签结合地区与学校类型快速定位目标院校,点击行进入院校详情查看历年招生数据。
          </Typography.Text>
        </div>
        <Input
          className="admission-university-search"
          size="large"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索学校名称或院校代码"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      <Collapse
        className="admission-advanced-collapse"
        defaultActiveKey={['filters']}
        items={[
          {
            key: 'filters',
            label: '院校筛选',
            children: (
              <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={12}>
                    <Typography.Text strong>院校层次</Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      <Checkbox.Group
                        options={TIER_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                        value={tiers}
                        onChange={(values) =>
                          setTiers(values as Array<keyof UniversityListQuery>)
                        }
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Typography.Text strong>办学性质</Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      <Checkbox.Group
                        options={ownershipOptions}
                        value={ownershipTypeCodes}
                        onChange={(values) => setOwnershipTypeCodes(values as string[])}
                      />
                    </div>
                  </Col>
                </Row>

                <Row gutter={[24, 16]}>
                  <Col xs={24} md={8}>
                    <Typography.Text strong>地区(省/市/自治区)</Typography.Text>
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      placeholder="选择地区"
                      style={{ width: '100%', marginTop: 8 }}
                      options={regionOptions}
                      value={regionCodes}
                      onChange={setRegionCodes}
                      optionFilterProp="label"
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Typography.Text strong>学校类型</Typography.Text>
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      placeholder="选择学校类型"
                      style={{ width: '100%', marginTop: 8 }}
                      options={schoolCategoryOptions}
                      value={schoolCategoryCodes}
                      onChange={setSchoolCategoryCodes}
                      optionFilterProp="label"
                    />
                  </Col>
                  <Col xs={24} md={8}>
                    <Typography.Text strong>办学层次</Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      <Radio.Group
                        value={educationLevelCode}
                        onChange={(event) => setEducationLevelCode(event.target.value)}
                      >
                        <Radio value="">不限</Radio>
                        {educationLevelOptions.map((opt) => (
                          <Radio key={opt.value} value={opt.value}>
                            {opt.label}
                          </Radio>
                        ))}
                      </Radio.Group>
                    </div>
                  </Col>
                </Row>

                <Row gutter={[24, 16]} align="middle">
                  <Col xs={24} md={12}>
                    <Typography.Text strong>保研资格</Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      <Radio.Group
                        value={hasPostgraduateRecommendation}
                        onChange={(event) =>
                          setHasPostgraduateRecommendation(event.target.value as TriBool)
                        }
                      >
                        <Radio value="">不限</Radio>
                        <Radio value="1">有</Radio>
                        <Radio value="0">无</Radio>
                      </Radio.Group>
                    </div>
                  </Col>
                  <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                    <Space>
                      <Button onClick={handleClearFilters}>清空筛选</Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={refreshUniversities}
                        loading={loading}
                      >
                        刷新结果
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Space>
            ),
          },
        ]}
      />

      <Row gutter={[16, 16]} className="admission-stat-row">
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="命中院校" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="985" value={stats.c985} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="211" value={stats.c211} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="双一流" value={stats.cDouble} />
          </Card>
        </Col>
      </Row>

      <div className="admission-result-header">
        <Segmented
          value={tab}
          onChange={(value) => setTab(value as RecommendationTab)}
          options={[
            { label: '院校列表', value: 'list' },
            { label: '招生明细', value: 'admission' },
          ]}
        />
      </div>

      {tab === 'list' && (
        <Table
          rowKey={(row) => row.id ?? row.university_code ?? row.name ?? ''}
          loading={loading}
          columns={columns}
          dataSource={universities}
          size="middle"
          scroll={{ x: 1280 }}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          onRow={(row) => ({
            onClick: () => row.id && navigate(`/university/${row.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      )}

      {tab === 'admission' && admissionOverLimit && (
        <Alert
          type="warning"
          showIcon
          message={`命中院校 ${universityIds.length} 所,超过 ${ADMISSION_BATCH_LIMIT} 所上限,请缩小筛选范围后再查看招生明细。`}
        />
      )}

      {tab === 'admission' && !admissionOverLimit && (
        <AdmissionDetailTable lines={admissionLines} loading={admissionLoading} />
      )}
    </div>
  )
}
