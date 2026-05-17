import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Affix,
  Alert,
  Button,
  Card,
  Form,
  Progress,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import type { AxiosError } from 'axios'
import { useUserProfileStore } from '@/stores/userProfileStore'
import type { UpsertProfileRequest, UserProfile } from '@/services/userProfile'
import RequiredSection from './sections/RequiredSection'

const { Title, Text, Paragraph } = Typography

type FormValues = UpsertProfileRequest

// Build the initial Form values from a saved profile. We only surface the 4
// required fields here — `preferences` and the legacy optional scalars are
// not editable in the survey anymore (the AI agent collects them in the
// conversation flow on demand).
function profileToFormValues(profile: UserProfile | null | undefined): Partial<FormValues> {
  if (!profile) return {}
  return {
    region_code: profile.region_code,
    subject_category_code: profile.subject_category_code,
    elective_subjects: profile.elective_subjects,
    total_score: profile.total_score,
  }
}

export default function ProfileSurveyPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<FormValues>()
  const {
    profile,
    hasCompletedProfile,
    filledCount,
    totalCount,
    loadProfile,
    updateProfile,
    loading,
  } = useUserProfileStore()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (profile) {
      form.setFieldsValue(profileToFormValues(profile))
    }
  }, [profile, form])

  const progressPercent = useMemo(() => {
    if (totalCount === 0) return 0
    return Math.round((filledCount / totalCount) * 100)
  }, [filledCount, totalCount])

  // 把 form values 合并到当前 profile 上再上传。
  // migration 008 之后 user_profiles 只剩 4 项核心字段，merge 主要为了在用户
  // 没动某个字段时保留原值（避免 PUT 把它写成 NULL）。
  function mergeUpsertPayload(values: Partial<FormValues>): UpsertProfileRequest {
    const base: UpsertProfileRequest = profile
      ? {
          region_code: profile.region_code,
          subject_category_code: profile.subject_category_code,
          elective_subjects: profile.elective_subjects,
          total_score: profile.total_score,
        }
      : {}
    return { ...base, ...values }
  }

  const onSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await updateProfile(mergeUpsertPayload(values))
      message.success('问卷已保存')
    } catch (err) {
      // Form.validateFields() rejects with an errorFields shape (no `response`),
      // while axios errors carry `response.data.message`. Distinguish:
      const axiosErr = err as AxiosError<{ message?: string }>
      if (axiosErr?.response) {
        message.error(axiosErr.response.data?.message || '保存失败，请检查输入')
      } else if ((err as { errorFields?: unknown })?.errorFields) {
        message.warning('请补全必填项')
      } else if (err instanceof Error) {
        message.error(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const onSaveAndReturn = async () => {
    await onSave()
    navigate('/dashboard')
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard')}
        style={{ padding: 0, marginBottom: 16 }}
      >
        返回工作台
      </Button>

      <Card
        bordered={false}
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
          color: '#fff',
          marginBottom: 24,
          borderRadius: 12,
        }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 240, flex: '1 1 320px' }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>高考志愿调查问卷</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8, marginBottom: 16 }}>
              一次填好基础信息，<strong>智能填报</strong>开新对话时 AI 会自动读取，不用再重复输入。
            </Paragraph>
            <Space size="middle" wrap>
              <Tag color={hasCompletedProfile ? 'green' : 'orange'} style={{ padding: '4px 12px', fontSize: 13 }}>
                {hasCompletedProfile ? '核心信息已完成' : '尚未完成'}
              </Tag>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                填写完整度 <strong>{filledCount}/{totalCount}</strong>
              </Text>
            </Space>
          </div>
          <div style={{ minWidth: 220, flex: '0 1 320px' }}>
            <Progress
              percent={progressPercent}
              strokeColor={{ from: '#FBBF24', to: '#FFFFFF' }}
              trailColor="rgba(255,255,255,0.25)"
              showInfo={false}
              size={[null, 10] as unknown as number}
            />
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              填得越完整，AI 推荐越精准。可选项随时回来补。
            </Text>
          </div>
        </div>
      </Card>

      <Form<FormValues>
        form={form}
        layout="vertical"
        requiredMark={(label, info) => (
          <span>
            {label}
            {info.required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
          </span>
        )}
      >
        <Card
          id="section-required"
          title={<><TrophyOutlined /> <span style={{ marginLeft: 8 }}>必填基本信息</span></>}
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          <RequiredSection />
        </Card>

        <Alert
          type="info"
          showIcon
          message="单科成绩、专业偏好、地域 / 家庭背景等更细的信息，AI 会在「智能填报」对话过程中按需向你询问，不必在此一次填齐。"
          style={{ marginTop: 8, marginBottom: 8 }}
        />
      </Form>

      <Affix offsetBottom={0}>
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #E5E7EB',
            padding: '12px 24px',
            marginTop: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button onClick={() => navigate('/dashboard')}>取消</Button>
          <Button onClick={onSave} loading={saving || loading} icon={<SaveOutlined />}>
            保存草稿
          </Button>
          <Button type="primary" onClick={onSaveAndReturn} loading={saving || loading}>
            保存并返回工作台
          </Button>
        </div>
      </Affix>
    </div>
  )
}
