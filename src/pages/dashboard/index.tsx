import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Button, Card, Tag, Typography } from 'antd'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  FormOutlined,
  IdcardOutlined,
  MobileOutlined,
  RocketOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { membershipApi } from '@/services/membership'
import { useUserProfileStore } from '@/stores/userProfileStore'
import { buildDashboardNextActions, type DashboardNextAction } from '@/utils/nextActions'
import ProfileSurveyModal from '@/components/ProfileSurveyModal'
import {
  ELECTIVE_SUBJECT_OPTIONS,
  REGION_OPTIONS,
  SUBJECT_CATEGORY_OPTIONS,
} from '@/utils/profileLabels'

const { Title, Text, Paragraph } = Typography

// 设计 token：与 index.css 中的 CSS 变量一致。这里直接 inline 是因为 antd 不支持把
// var(--x) 用进 inline style 的所有属性（如 boxShadow），写成具名常量更稳定。
const COLORS = {
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  surface: '#FFFFFF',
  primary: '#1E40AF',
  primarySoft: '#EFF6FF',
  primarySofter: '#F1F5F9',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  accent: '#EA580C',
}

const SHADOW_CARD = '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [membershipActive, setMembershipActive] = useState(false)
  const [surveyModalOpen, setSurveyModalOpen] = useState(false)
  const {
    profile,
    hasCompletedProfile,
    loadProfile,
  } = useUserProfileStore()

  // 把 profile 上的 code 映射成中文标签。未填写时整张卡片仍渲染但 4 项显示空态。
  const profileSummary = useMemo(() => {
    const regionLabel = REGION_OPTIONS.find((o) => o.code === profile?.region_code)?.label
    const subjectLabel = SUBJECT_CATEGORY_OPTIONS.find((o) => o.code === profile?.subject_category_code)?.label
    const electives = (profile?.elective_subjects ?? [])
      .map((code) => ELECTIVE_SUBJECT_OPTIONS.find((o) => o.code === code)?.label ?? code)
      .join(' / ')
    return {
      region: regionLabel ?? null,
      subject: subjectLabel ?? null,
      electives: electives || null,
      totalScore: typeof profile?.total_score === 'number' ? profile.total_score : null,
    }
  }, [profile])

  useEffect(() => {
    if (!user) return

    let cancelled = false
    const run = async () => {
      try {
        const membershipRes = await membershipApi.getCurrent()
        if (!cancelled) setMembershipActive(Boolean(membershipRes.data.data?.active))
      } catch {
        if (!cancelled) setMembershipActive(false)
      }
    }

    void run()
    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [user, loadProfile])

  const nextActions = user
    ? buildDashboardNextActions({
        phoneVerified: Boolean(user.phone_verified),
        membershipActive,
      })
    : []

  const nextActionIcons: Record<DashboardNextAction['key'], ReactNode> = {
    'verify-phone': <MobileOutlined />,
    'review-membership': <CrownOutlined />,
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ──── 页面标题 ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ marginBottom: 4, fontSize: 28, fontWeight: 600, color: COLORS.text }}>
          我的工作台
        </Title>
        <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
          填好考生档案，让 AI 智能填报根据你的真实信息生成更精准的志愿方案。
        </Text>
      </div>

      {/* ──── 考生档案主卡片 ────────────────────────────────────── */}
      <Card
        variant="outlined"
        style={{ marginBottom: 16, borderColor: COLORS.border, boxShadow: SHADOW_CARD }}
        styles={{ body: { padding: hasCompletedProfile ? 0 : 32 } }}
      >
        {hasCompletedProfile ? (
          <ProfileFilledView
            summary={profileSummary}
            onEdit={() => setSurveyModalOpen(true)}
          />
        ) : (
          <ProfileEmptyView onFill={() => setSurveyModalOpen(true)} />
        )}
      </Card>

      {/* ──── 账号 / 手机 / 会员 横排状态条 ─────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatusTile
          icon={<IdcardOutlined />}
          label="账号状态"
          value="正常"
          tone="success"
        />
        <StatusTile
          icon={<MobileOutlined />}
          label="手机号验证"
          value={user?.phone_verified ? '已验证' : '待验证'}
          tone={user?.phone_verified ? 'success' : 'warning'}
        />
        <StatusTile
          icon={<CrownOutlined />}
          label="会员"
          value={membershipActive ? '有效会员' : '普通用户'}
          tone={membershipActive ? 'warning' : 'neutral'}
        />
      </div>

      {/* ──── 推荐下一步 ────────────────────────────────────────── */}
      {nextActions.length > 0 && (
        <Card
          variant="outlined"
          style={{ borderColor: COLORS.border, boxShadow: SHADOW_CARD }}
          styles={{ body: { padding: 0 } }}
          title={
            <span style={{ color: COLORS.text, fontWeight: 600 }}>
              <RocketOutlined style={{ color: COLORS.primary, marginRight: 8 }} />
              推荐下一步
            </span>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {nextActions.map((action, idx) => (
              <NextActionRow
                key={action.key}
                icon={nextActionIcons[action.key]}
                title={action.title}
                description={action.description}
                href={action.href}
                isLast={idx === nextActions.length - 1}
              />
            ))}
          </div>
        </Card>
      )}

      <ProfileSurveyModal
        open={surveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// 子组件：考生档案 - 已填写视图
// ────────────────────────────────────────────────────────────────
type ProfileSummary = {
  region: string | null
  subject: string | null
  electives: string | null
  totalScore: number | null
}

function ProfileFilledView({
  summary,
  onEdit,
}: {
  summary: ProfileSummary
  onEdit: () => void
}) {
  return (
    <div>
      {/* 卡片 header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: COLORS.primarySoft,
              color: COLORS.primary,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <FormOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, lineHeight: 1.2 }}>
              考生档案
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
              AI 在新对话中会自动读取这些信息
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color="green" style={{ marginRight: 0, fontWeight: 500 }}>
            <CheckCircleOutlined style={{ marginRight: 4 }} />
            核心信息已完整
          </Tag>
          <Button type="text" icon={<EditOutlined />} onClick={onEdit}>
            修改
          </Button>
        </div>
      </div>

      {/* 4 项核心信息网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 0,
        }}
      >
        <ProfileField label="所在省份" icon={<EnvironmentOutlined />} value={summary.region} />
        <ProfileField label="首选科目" icon={<ExperimentOutlined />} value={summary.subject} />
        <ProfileField label="再选科目" icon={<ExperimentOutlined />} value={summary.electives} />
        <ProfileField
          label="高考总分"
          icon={<TrophyOutlined />}
          value={summary.totalScore !== null ? summary.totalScore : null}
          suffix={summary.totalScore !== null ? '分' : undefined}
          highlight
        />
      </div>
    </div>
  )
}

function ProfileField({
  label,
  icon,
  value,
  suffix,
  highlight,
}: {
  label: string
  icon: ReactNode
  value: string | number | null
  suffix?: string
  highlight?: boolean
}) {
  const isEmpty = value === null || value === '' || value === undefined
  return (
    <div
      style={{
        padding: '20px 24px',
        borderRight: `1px solid ${COLORS.border}`,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          color: COLORS.textSecondary,
          marginBottom: 8,
          letterSpacing: 0.2,
        }}
      >
        <span style={{ color: COLORS.textMuted }}>{icon}</span>
        {label}
      </div>
      <div
        style={{
          fontSize: highlight ? 22 : 18,
          fontWeight: highlight ? 700 : 600,
          color: isEmpty ? COLORS.textMuted : COLORS.text,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {isEmpty ? '—' : value}
        {suffix && !isEmpty && (
          <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textSecondary, marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// 子组件：考生档案 - 空状态视图
// ────────────────────────────────────────────────────────────────
function ProfileEmptyView({ onFill }: { onFill: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: COLORS.primarySoft,
          color: COLORS.primary,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        <FormOutlined />
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <Title level={4} style={{ margin: 0, color: COLORS.text, fontWeight: 600 }}>
          先填写考生档案
        </Title>
        <Paragraph
          style={{
            margin: '6px 0 0',
            color: COLORS.textSecondary,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          填好<strong style={{ color: COLORS.text }}>省份 / 首选科目 / 再选 4 选 2 / 高考总分</strong>四项核心信息，AI 智能填报会自动换算位次、匹配可填院校专业组数。其余偏好 AI 会在对话中按需追问。
        </Paragraph>
      </div>
      <Button
        type="primary"
        size="large"
        icon={<ArrowRightOutlined />}
        iconPlacement="end"
        onClick={onFill}
        style={{ minHeight: 44, paddingInline: 24, fontWeight: 500 }}
      >
        立即填写
      </Button>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// 子组件：状态条
// ────────────────────────────────────────────────────────────────
type StatusTone = 'success' | 'warning' | 'neutral'

function StatusTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  tone: StatusTone
}) {
  const palette: Record<StatusTone, { fg: string; bg: string; text: string }> = {
    success: { fg: COLORS.success, bg: COLORS.successSoft, text: COLORS.success },
    warning: { fg: COLORS.warning, bg: COLORS.warningSoft, text: COLORS.warning },
    neutral: { fg: COLORS.textSecondary, bg: COLORS.primarySofter, text: COLORS.text },
  }
  const c = palette[tone]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        boxShadow: SHADOW_CARD,
        minHeight: 64,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: c.bg,
          color: c.fg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: c.text, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// 子组件：推荐下一步 列表行
// ────────────────────────────────────────────────────────────────
function NextActionRow({
  icon,
  title,
  description,
  href,
  isLast,
}: {
  icon: ReactNode
  title: string
  description: string
  href: string
  isLast: boolean
}) {
  return (
    <Link
      to={href}
      style={{
        display: 'flex',
        gap: 16,
        padding: '16px 24px',
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.border}`,
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.primarySofter)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.primary,
          background: COLORS.primarySoft,
          flex: '0 0 auto',
          fontSize: 16,
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: 4, fontSize: 14 }}>
          {title}
        </div>
        <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
          {description}
        </div>
      </div>
      <ArrowRightOutlined style={{ color: COLORS.textMuted, fontSize: 14, alignSelf: 'center' }} />
    </Link>
  )
}
