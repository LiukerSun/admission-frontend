import { useEffect } from 'react'
import { Form, Modal, message } from 'antd'
import type { AxiosError } from 'axios'
import { useUserProfileStore } from '@/stores/userProfileStore'
import type { UpsertProfileRequest, UserProfile } from '@/services/userProfile'
import RequiredSection from '@/pages/profile-survey/sections/RequiredSection'

type FormValues = UpsertProfileRequest

type Props = {
  open: boolean
  onClose: () => void
  // 保存成功后回调；用于让调用方关闭弹窗或刷新本地视图（store 自己也会更新）。
  onSaved?: (profile: UserProfile) => void
}

// 把 form 当前的必填项与 store 上已有 profile 合并。
// migration 008 之后 user_profiles 只剩 4 项核心字段，合并主要为了在用户没动某
// 个字段时保留原值（避免 PUT 把它写成 NULL）。
function mergeUpsertPayload(profile: UserProfile | null, values: Partial<FormValues>): UpsertProfileRequest {
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

function profileToFormValues(profile: UserProfile | null | undefined): Partial<FormValues> {
  if (!profile) return {}
  return {
    region_code: profile.region_code,
    subject_category_code: profile.subject_category_code,
    elective_subjects: profile.elective_subjects,
    total_score: profile.total_score,
  }
}

export default function ProfileSurveyModal({ open, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { profile, updateProfile, loading } = useUserProfileStore()

  // 弹窗每次打开都重置成"当前 profile 已有值"；用户上次取消编辑的脏值不会残留。
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue(profileToFormValues(profile))
    }
  }, [open, profile, form])

  const onOk = async () => {
    let values: Partial<FormValues>
    try {
      values = await form.validateFields()
    } catch (err) {
      if ((err as { errorFields?: unknown })?.errorFields) {
        message.warning('请补全必填项')
        return
      }
      throw err
    }

    try {
      const saved = await updateProfile(mergeUpsertPayload(profile, values))
      message.success('考生档案已保存')
      onSaved?.(saved)
      onClose()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      message.error(axiosErr?.response?.data?.message || '保存失败，请稍后重试')
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onOk}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
      width={640}
      centered
      title={
        <div style={{ paddingRight: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>
            填写考生档案
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: 400 }}>
            填好这 4 项核心信息，AI 智能填报会自动换算位次、匹配可填院校专业组数。
          </div>
        </div>
      }
      styles={{
        header: { borderBottom: '1px solid #E2E8F0', paddingBottom: 16, marginBottom: 0 },
        body: { paddingTop: 20, paddingBottom: 4 },
        footer: { borderTop: '1px solid #E2E8F0', paddingTop: 12, marginTop: 16 },
      }}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        requiredMark={(label, info) => (
          <span style={{ fontWeight: 500, color: '#0F172A' }}>
            {label}
            {info.required && <span style={{ color: '#DC2626', marginLeft: 4 }}>*</span>}
          </span>
        )}
        scrollToFirstError
      >
        <RequiredSection />
      </Form>
    </Modal>
  )
}
