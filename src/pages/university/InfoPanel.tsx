import { Card, Tag, Typography, Empty } from 'antd'
import type { AdmissionLine, UniversityProfile, University } from '@/services/admission'

interface InfoPanelProps {
  profile: UniversityProfile | null
  selectedMajor: AdmissionLine | null
  selectedGroupLines: AdmissionLine[]
  university: University | null
  loading: boolean
}

export default function InfoPanel({ profile, selectedMajor, selectedGroupLines, university }: InfoPanelProps) {
  if (selectedMajor) {
    return <MajorInfoPanel major={selectedMajor} />
  }

  return <UniversityInfoPanel profile={profile} university={university} groupLines={selectedGroupLines} />
}

function UniversityInfoPanel({
  profile,
  university,
  groupLines,
}: {
  profile: UniversityProfile | null
  university: University | null
  groupLines: AdmissionLine[]
}) {
  if (!profile && !university) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无学校信息" />
  }

  const softRank = profile?.soft_rank ? `软科排名 ${profile.soft_rank}` : undefined
  const alumniRank = profile?.alumni_rank ? `校友会排名 ${profile.alumni_rank}` : undefined
  const difficultyRank = profile?.difficulty_rank ? `录取难度 ${profile.difficulty_rank}` : undefined

  return (
    <Card className="info-panel" size="small" title={<Typography.Text strong>学校信息</Typography.Text>}>
      <div className="info-grid">
        {detailItem('学校名称', university?.name)}
        {detailItem('院校代码', university?.university_code)}
        {detailItem('所在城市', profile?.city)}
        {detailItem('办学层次', profile?.education_level_name)}
        {detailItem('隶属', profile?.affiliation)}
        {detailItem('办学性质', profile?.ownership_type_name)}
        {detailItem('学校类型', profile?.school_category_name)}
        {detailItem('学校标签', profile?.school_level_tags)}
        {detailItem('卓越计划', profile?.excellence_tags)}
        {detailItem('排名', [softRank, alumniRank, difficultyRank].filter(Boolean).join(' / ') || undefined)}
        {detailItem('硕士点数量', profile?.master_program_count)}
        {detailItem('博士点数量', profile?.doctoral_program_count)}
        {detailItem('国家重点学科', profile?.national_key_subject_count)}
        {detailItem('推免率', profile?.postgraduate_recommendation_rate ? `${(profile.postgraduate_recommendation_rate * 100).toFixed(1)}%` : undefined)}
      </div>

      {profile?.is_985 && <Tag color="red">985</Tag>}
      {profile?.is_211 && <Tag color="orange">211</Tag>}
      {profile?.is_double_first_class && <Tag color="blue">双一流</Tag>}
      {profile?.is_national_key && <Tag color="green">国家重点</Tag>}
      {profile?.is_provincial_key && <Tag color="cyan">省重点</Tag>}
      {profile?.has_postgraduate_recommendation && <Tag color="purple">具有推免资格</Tag>}

      {groupLines.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {groupLines.length > 0
              ? `当前${groupLines.length}条招生记录`
              : '全部招生数据'}
          </Typography.Text>
        </div>
      )}
    </Card>
  )
}

function MajorInfoPanel({ major }: { major: AdmissionLine }) {
  return (
    <Card
      className="info-panel"
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text strong>{major.local_major_name || '专业信息'}</Typography.Text>
          {major.group_code && <Tag color="geekblue">{major.group_code}</Tag>}
        </div>
      }
    >
      <div className="info-grid">
        {detailItem('专业代码', major.local_major_code)}
        {detailItem('学科门类', major.discipline_category)}
        {detailItem('一级学科', major.first_level_discipline)}
        {detailItem('第四轮学科评估', major.fourth_round_subject_eval)}
        {detailItem('双一流学科', major.double_first_class_subject)}
        {detailItem('软科等级', major.soft_major_grade)}
        {detailItem('专业排名', major.major_rank)}
        {detailItem('国家特色专业', major.is_national_feature ? '是' : undefined)}
        {detailItem('学制', major.duration)}
        {detailItem('学费', major.tuition ? `${major.tuition}元/年` : undefined)}
        {detailItem('选科要求', major.subject_requirement_name)}
        {detailItem('年份', major.admission_year)}
        {detailItem('计划人数', major.plan_count)}
        {detailItem('最低分', major.min_score)}
        {detailItem('最低位次', major.min_rank)}
      </div>

      {textBlock('专业简介', major.major_intro)}
      {textBlock('培养目标', major.training_goal)}
      {textBlock('学科要求', major.subject_study_requirement)}
      {textBlock('主要课程', major.main_courses)}
      {textBlock('考研方向', major.postgraduate_direction)}
      {textBlock('就业方向', major.employment_direction)}
      {textBlock('对应硕士专业', major.corresponding_master_majors)}
      {textBlock('对应博士专业', major.corresponding_doctoral_majors)}
    </Card>
  )
}

function detailItem(label: string, value?: string | number | boolean | null) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="info-grid-item" key={label}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
      <Typography.Text style={{ fontSize: 13 }}>{String(value)}</Typography.Text>
    </div>
  )
}

function textBlock(label: string, value?: string) {
  if (!value) return null
  return (
    <div style={{ marginTop: 12 }} key={label}>
      <Typography.Text strong style={{ fontSize: 13 }}>{label}</Typography.Text>
      <Typography.Paragraph style={{ fontSize: 13, marginTop: 4, marginBottom: 0, color: '#475569' }}>
        {value}
      </Typography.Paragraph>
    </div>
  )
}
