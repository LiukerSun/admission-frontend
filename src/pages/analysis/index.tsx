import { useEffect, useRef, useState } from 'react'
import { Card, Row, Col, Select, Tabs, Table, Space, Tag, Button, Tooltip } from 'antd'
import { DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'

const { Option } = Select

/* ─────────── Mock data ─────────── */
const YEARS = ['2020', '2021', '2022', '2023', '2024']

const UNIVERSITY_DATA = {
  years: YEARS,
  series: [
    { name: '清华大学', data: [687, 681, 688, 685, 690] },
    { name: '北京大学', data: [683, 678, 684, 682, 688] },
    { name: '复旦大学', data: [675, 670, 676, 674, 679] },
    { name: '浙江大学', data: [668, 663, 669, 667, 672] },
    { name: '南京大学', data: [660, 655, 661, 659, 664] },
  ],
}

const MAJOR_SALARY = [
  { major: '计算机科学与技术', avgSalary: 15800, employmentRate: 96 },
  { major: '软件工程', avgSalary: 15200, employmentRate: 95 },
  { major: '人工智能', avgSalary: 16800, employmentRate: 94 },
  { major: '电子信息工程', avgSalary: 13500, employmentRate: 93 },
  { major: '金融学', avgSalary: 12800, employmentRate: 88 },
  { major: '临床医学', avgSalary: 12000, employmentRate: 97 },
  { major: '法学', avgSalary: 9800, employmentRate: 82 },
  { major: '土木工程', avgSalary: 9200, employmentRate: 90 },
]

const FUNNEL_DATA = [
  { value: 100, name: '可填报院校' },
  { value: 65, name: '稳妥院校' },
  { value: 30, name: '冲刺院校' },
  { value: 12, name: '最终志愿' },
]

const ADMISSION_PROBABILITY = [
  { university: '清华大学', major: '计算机类', probability: 15, risk: 'high' },
  { university: '浙江大学', major: '工科试验班', probability: 45, risk: 'medium' },
  { university: '南京大学', major: '软件工程', probability: 72, risk: 'low' },
  { university: '华中科技大学', major: '计算机科学与技术', probability: 85, risk: 'low' },
  { university: '武汉大学', major: '电子信息类', probability: 68, risk: 'medium' },
]

const SCORE_RANK = [
  { score: 690, rank: 50, count: 12 },
  { score: 685, rank: 120, count: 25 },
  { score: 680, rank: 280, count: 38 },
  { score: 675, rank: 520, count: 55 },
  { score: 670, rank: 890, count: 72 },
  { score: 665, rank: 1350, count: 95 },
  { score: 660, rank: 1920, count: 118 },
  { score: 655, rank: 2680, count: 142 },
  { score: 650, rank: 3560, count: 168 },
  { score: 645, rank: 4620, count: 195 },
]

/* ─────────── Chart components ─────────── */
function LineChart({ data }: { data: typeof UNIVERSITY_DATA }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      grid: { left: 48, right: 24, top: 24, bottom: 48 },
      xAxis: { type: 'category', data: data.years },
      yAxis: { type: 'value', name: '分数线', min: 640 },
      series: data.series.map((s, i) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        itemStyle: { color: ['#1E40AF', '#3B82F6', '#D97706', '#16A34A', '#8B5CF6'][i] },
      })),
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [data])
  return <div ref={ref} style={{ width: '100%', height: 360 }} />
}

function BarChart({ data }: { data: typeof MAJOR_SALARY }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 48, right: 24, top: 24, bottom: 80 },
      xAxis: { type: 'category', data: data.map(d => d.major), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', name: '平均月薪(元)' },
      series: [{
        type: 'bar',
        data: data.map(d => d.avgSalary),
        itemStyle: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1E40AF' },
            { offset: 1, color: '#3B82F6' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '50%',
      }],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [data])
  return <div ref={ref} style={{ width: '100%', height: 360 }} />
}

function PieChart({ data }: { data: typeof MAJOR_SALARY }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
      legend: { orient: 'vertical', right: 0, top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: data.map(d => ({ name: d.major, value: d.employmentRate })),
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        color: ['#1E40AF', '#3B82F6', '#D97706', '#16A34A', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
      }],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [data])
  return <div ref={ref} style={{ width: '100%', height: 360 }} />
}

function FunnelChart({ data }: { data: typeof FUNNEL_DATA }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}所' },
      series: [{
        type: 'funnel',
        left: '10%',
        width: '80%',
        minSize: '20%',
        label: { show: true, position: 'inside', formatter: '{b}\n{c}所' },
        data: data,
        color: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD'],
      }],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [data])
  return <div ref={ref} style={{ width: '100%', height: 360 }} />
}

function RankChart({ data }: { data: typeof SCORE_RANK }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 56, right: 24, top: 24, bottom: 48 },
      xAxis: { type: 'category', data: data.map(d => d.score + '分') },
      yAxis: [
        { type: 'value', name: '位次', position: 'left' },
        { type: 'value', name: '人数', position: 'right' },
      ],
      series: [
        {
          name: '累计位次',
          type: 'line',
          data: data.map(d => d.rank),
          smooth: true,
          itemStyle: { color: '#1E40AF' },
          areaStyle: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#1E40AF33' },
              { offset: 1, color: '#1E40AF05' },
            ]),
          },
        },
        {
          name: '同分人数',
          type: 'bar',
          yAxisIndex: 1,
          data: data.map(d => d.count),
          itemStyle: { color: '#D97706', borderRadius: [4, 4, 0, 0] },
          barWidth: '40%',
        },
      ],
    })
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [data])
  return <div ref={ref} style={{ width: '100%', height: 360 }} />
}

/* ─────────── Main page ─────────── */
export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('university')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [selectedProvince, setSelectedProvince] = useState('浙江')

  const probabilityColumns = [
    { title: '院校', dataIndex: 'university', key: 'university' },
    { title: '专业', dataIndex: 'major', key: 'major' },
    {
      title: '录取概率',
      dataIndex: 'probability',
      key: 'probability',
      sorter: (a: typeof ADMISSION_PROBABILITY[0], b: typeof ADMISSION_PROBABILITY[0]) => a.probability - b.probability,
      render: (v: number) => (
        <Tooltip title={`基于历年数据和${selectedYear}年招生计划估算`}>
          <span style={{ fontWeight: 600, color: v >= 70 ? '#16A34A' : v >= 40 ? '#D97706' : '#DC2626' }}>
            {v}%
          </span>
        </Tooltip>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'risk',
      key: 'risk',
      render: (v: string) => (
        v === 'low' ? <Tag color="success">稳妥</Tag> :
        v === 'medium' ? <Tag color="warning">适中</Tag> :
        <Tag color="error">冲刺</Tag>
      ),
    },
  ]

  const salaryColumns = [
    { title: '专业', dataIndex: 'major', key: 'major' },
    { title: '平均月薪', dataIndex: 'avgSalary', key: 'avgSalary', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '就业率', dataIndex: 'employmentRate', key: 'employmentRate', render: (v: number) => `${v}%` },
  ]

  const rankColumns = [
    { title: '分数', dataIndex: 'score', key: 'score' },
    { title: '累计位次', dataIndex: 'rank', key: 'rank' },
    { title: '同分人数', dataIndex: 'count', key: 'count' },
  ]

  const handleExport = () => {
    const csv = [
      ['院校', '专业', '录取概率', '风险等级'].join(','),
      ...ADMISSION_PROBABILITY.map(r => [r.university, r.major, `${r.probability}%`, r.risk].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `志愿分析_${selectedProvince}_${selectedYear}.csv`
    link.click()
  }

  const tabItems = [
    {
      key: 'university',
      label: '院校分数线',
      children: (
        <Card
          title="历年录取分数线趋势"
          extra={
            <Space>
              <Select value={selectedProvince} onChange={setSelectedProvince} style={{ width: 100 }}>
                <Option value="浙江">浙江</Option>
                <Option value="江苏">江苏</Option>
                <Option value="山东">山东</Option>
              </Select>
              <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 100 }}>
                {YEARS.map(y => <Option key={y} value={y}>{y}年</Option>)}
              </Select>
            </Space>
          }
        >
          <LineChart data={UNIVERSITY_DATA} />
          <div style={{ marginTop: 16 }}>
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: '院校', dataIndex: 'name', key: 'name' },
                ...YEARS.map(y => ({ title: y, dataIndex: y, key: y })),
              ]}
              dataSource={UNIVERSITY_DATA.series.map(s => ({
                name: s.name,
                ...Object.fromEntries(s.data.map((d, i) => [YEARS[i], d])),
              }))}
            />
          </div>
        </Card>
      ),
    },
    {
      key: 'major',
      label: '专业分析',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card title="热门专业薪资对比">
              <BarChart data={MAJOR_SALARY} />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="专业就业率分布">
              <PieChart data={MAJOR_SALARY} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="专业数据详情" extra={<Button icon={<DownloadOutlined />} onClick={handleExport}>导出数据</Button>}>
              <Table
                rowKey="major"
                columns={salaryColumns}
                dataSource={MAJOR_SALARY}
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'probability',
      label: '志愿模拟',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="冲稳保分析">
              <FunnelChart data={FUNNEL_DATA} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="录取概率预测"
              extra={
                <Tooltip title="基于历年录取数据、招生计划和位次变化模型估算">
                  <InfoCircleOutlined style={{ color: '#94A3B8' }} />
                </Tooltip>
              }
            >
              <Table
                rowKey="university"
                columns={probabilityColumns}
                dataSource={ADMISSION_PROBABILITY}
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'rank',
      label: '一分一段',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Card title="位次分布图">
              <RankChart data={SCORE_RANK} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="一分一段表" extra={<Button icon={<DownloadOutlined />} onClick={handleExport}>导出CSV</Button>}>
              <Table
                rowKey="score"
                columns={rankColumns}
                dataSource={SCORE_RANK}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>数据分析</h2>
      <p style={{ color: '#64748B', marginBottom: 24 }}>
        基于历年高考数据和AI模型，为志愿填报提供数据支持
      </p>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  )
}
