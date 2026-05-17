import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Modal,
  Skeleton,
  Space,
  Table,
  Typography,
  type TableColumnsType,
} from 'antd'
import {
  ArrowRightOutlined,
  BankOutlined,
  BookOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LoadingOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import type { AxiosError } from 'axios'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import * as echarts from 'echarts'
import { admissionApi, type VolunteerPlanGroup, type RichVolunteerPlan } from '@/services/admission'
import {
  volunteerPlansApi,
  type UserVolunteerPlan,
  type UserVolunteerPlanSummary,
} from '@/services/volunteerPlans'
import { generateHtmlReport, getChartData, getChartOptions } from '@/utils/htmlExportUtils'

const { Paragraph, Text, Title } = Typography

// ─────────────────────────────────────────────────────────────────
// Design tokens（与 dashboard / index.css 一致）
// ─────────────────────────────────────────────────────────────────
const C = {
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  surface: '#FFFFFF',
  primary: '#1E40AF',
  primarySoft: '#EFF6FF',
  primarySofter: '#F1F5F9',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
}
const SHADOW_CARD = '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
// PlanDraft 现在只承担「单条志愿备注」这一种 client-side state（后端尚无对应接口）。
// 方案名（title）/ 方案备注（description）已经走真实 API 持久化，直接从 server data 读。
type PlanDraft = {
  volunteerNotes: Record<string, string> // key = groupStableKey
}

type SaveStatus = 'saved' | 'saving' | 'failed'

type VolunteerTableRow = {
  key: string
  groupKey: string
  group: VolunteerPlanGroup
  majorOrder: number
  majorCode: string
  majorName: string
  isFirstRow: boolean
}

// 业务级稳定 key —— 后端 plan_json 里 group.id 经常是 0，
// universityCode+groupCode 在方案内业务唯一。
function groupStableKey(group: VolunteerPlanGroup, idx: number): string {
  if (group.universityCode && group.groupCode) {
    return `${group.universityCode}-${group.groupCode}`
  }
  return `g${idx}`
}

// ─────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────
export default function VolunteerPlansPage() {
  const { message, modal } = App.useApp()

  // 列表轻量摘要（mount 时拉一次），详情按需 lazy-load 进 planCache。
  const [summaries, setSummaries] = useState<UserVolunteerPlanSummary[]>([])
  const [planCache, setPlanCache] = useState<Record<number, UserVolunteerPlan>>({})
  const [activePlanId, setActivePlanId] = useState<number | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [drafts, setDrafts] = useState<Record<number, PlanDraft>>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')

  const [renameOpen, setRenameOpen] = useState(false)
  const [planNoteOpen, setPlanNoteOpen] = useState(false)
  const [volunteerNoteTarget, setVolunteerNoteTarget] = useState<{
    key: string
    group: VolunteerPlanGroup
  } | null>(null)

  const [renameForm] = Form.useForm<{ name: string }>()
  const [planNoteForm] = Form.useForm<{ note: string }>()
  const [volunteerNoteForm] = Form.useForm<{ note: string }>()

  // ── 数据加载 ──────────────────────────────────────────────────
  // mount: 只拉摘要。
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        setListLoading(true)
        const res = await volunteerPlansApi.list()
        if (!alive) return
        const list = res.data?.data ?? []
        setSummaries(list)
        if (list.length > 0) setActivePlanId(list[0].id)
      } catch {
        if (alive) message.error('获取志愿方案失败')
      } finally {
        if (alive) setListLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [message])

  // activePlanId 变化时 lazy-load 详情进 cache。cache 命中跳过。
  useEffect(() => {
    if (activePlanId == null) return
    if (planCache[activePlanId]) return
    let alive = true
    void (async () => {
      try {
        setDetailLoading(true)
        const res = await volunteerPlansApi.get(activePlanId)
        if (!alive) return
        const plan = res.data?.data
        if (plan) setPlanCache((prev) => ({ ...prev, [activePlanId]: plan }))
      } catch {
        if (alive) message.error('获取方案详情失败')
      } finally {
        if (alive) setDetailLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [activePlanId, planCache, message])

  // ── 渲染优先级分离（点击列表项的瞬间反馈）──────────────────────
  // activePlanId 同步更新（列表 active 视觉立即变）；
  // deferredPlanId 给 Table 用，React 18 自动降低 Table 重渲染优先级。
  const deferredPlanId = useDeferredValue(activePlanId)

  // ── 派生数据 ──────────────────────────────────────────────────
  const activeSummary = useMemo(() => {
    if (activePlanId == null) return summaries[0]
    return summaries.find((s) => s.id === activePlanId) ?? summaries[0]
  }, [activePlanId, summaries])

  const activePlan = useMemo(() => {
    if (deferredPlanId == null) return undefined
    return planCache[deferredPlanId]
  }, [deferredPlanId, planCache])

  // activeDraft 只承担单条志愿备注的 client-side 缓冲。
  // 方案名 / 方案备注从 activeSummary 直接读（已经是 server 持久值）。
  const activeDraft = useMemo<PlanDraft>(() => {
    if (!activeSummary) return { volunteerNotes: {} }
    return drafts[activeSummary.id] ?? { volunteerNotes: {} }
  }, [activeSummary, drafts])

  const tableData = useMemo<VolunteerTableRow[]>(() => {
    if (!activePlan) return []
    const rows: VolunteerTableRow[] = []
    ;(activePlan.plan_json?.groups ?? []).forEach((group, idx) => {
      const gKey = groupStableKey(group, idx)
      for (let i = 1; i <= 6; i++) {
        const major = (group.majors ?? []).find((m) => m.majorOrder === i)
        rows.push({
          key: `${gKey}-m${i}`,
          groupKey: gKey,
          group,
          majorOrder: i,
          majorCode: major?.majorCode ?? '',
          majorName: major?.majorName ?? '',
          isFirstRow: i === 1,
        })
      }
    })
    return rows
  }, [activePlan])

  // ── Drafts（仅 volunteerNotes）────────────────────────────────
  const updateDraft = (planId: number, updater: (draft: PlanDraft) => PlanDraft) => {
    setDrafts((current) => {
      const existing = current[planId] ?? { volunteerNotes: {} }
      return { ...current, [planId]: updater(existing) }
    })
  }

  // PATCH 成功后用 response 同步 summaries（title/description）和 planCache。
  // 这样列表项标题、备注 banner、详情头部都立即反映持久化结果。
  const applyServerPlan = useCallback((plan: UserVolunteerPlan) => {
    setSummaries((prev) =>
      prev.map((s) =>
        s.id === plan.id ? { ...s, title: plan.title, description: plan.description } : s,
      ),
    )
    setPlanCache((prev) => ({ ...prev, [plan.id]: plan }))
  }, [])

  const handlePlanClick = useCallback(
    (id: number) => {
      if (id === activePlanId) return
      setActivePlanId(id)
    },
    [activePlanId],
  )

  // ── Modal open / save ─────────────────────────────────────────
  const openRename = () => {
    renameForm.setFieldsValue({ name: activeSummary?.title ?? '' })
    setRenameOpen(true)
  }
  const openPlanNote = () => {
    planNoteForm.setFieldsValue({ note: activeSummary?.description ?? '' })
    setPlanNoteOpen(true)
  }
  const openVolunteerNote = (groupKey: string, group: VolunteerPlanGroup) => {
    volunteerNoteForm.setFieldsValue({
      note: activeDraft.volunteerNotes[groupKey] ?? group.remark ?? '',
    })
    setVolunteerNoteTarget({ key: groupKey, group })
  }

  // saveRename / savePlanNote 都走 PATCH /volunteer-plans/:id：
  // 成功后用 server response 同步 summaries + planCache，刷新后仍能看到。
  // 网络失败保留 modal 打开，让用户重试 —— 不再悄无声息写 local。
  const saveRename = async () => {
    if (!activeSummary) return
    let values: { name: string }
    try {
      values = await renameForm.validateFields()
    } catch {
      return
    }
    const newName = values.name.trim()
    if (!newName) return
    try {
      setSaveStatus('saving')
      const res = await volunteerPlansApi.update(activeSummary.id, { title: newName })
      const plan = res.data?.data
      if (plan) applyServerPlan(plan)
      setRenameOpen(false)
      setSaveStatus('saved')
      message.success('方案名称已更新')
    } catch (err) {
      setSaveStatus('failed')
      const axiosErr = err as AxiosError<{ message?: string }>
      message.error(axiosErr?.response?.data?.message || '保存失败，请重试')
    }
  }

  const savePlanNote = async () => {
    if (!activeSummary) return
    let values: { note: string }
    try {
      values = await planNoteForm.validateFields()
    } catch {
      return
    }
    try {
      setSaveStatus('saving')
      const res = await volunteerPlansApi.update(activeSummary.id, { description: values.note })
      const plan = res.data?.data
      if (plan) applyServerPlan(plan)
      setPlanNoteOpen(false)
      setSaveStatus('saved')
      message.success('方案备注已更新')
    } catch (err) {
      setSaveStatus('failed')
      const axiosErr = err as AxiosError<{ message?: string }>
      message.error(axiosErr?.response?.data?.message || '保存失败，请重试')
    }
  }

  const saveVolunteerNote = async () => {
    if (!activeSummary || !volunteerNoteTarget) return
    try {
      const values = await volunteerNoteForm.validateFields()
      setSaveStatus('saving')
      const targetKey = volunteerNoteTarget.key
      updateDraft(activeSummary.id, (d) => ({
        ...d,
        volunteerNotes: { ...d.volunteerNotes, [targetKey]: values.note },
      }))
      setVolunteerNoteTarget(null)
      setSaveStatus('saved')
      message.success('志愿备注已更新（本地）')
    } catch {
      setSaveStatus('failed')
    }
  }

  // ── 删除 ──────────────────────────────────────────────────────
  // 软删除：后端 deleted_at = NOW()，列表不再展示。本地同步：从 summaries
  // 移除，从 planCache 删 entry；若删的是当前 active，则切到剩下的第一个，
  // 全空时回到 null（详情区显示 PlansDetailEmpty）。
  const handleDelete = useCallback(() => {
    if (!activeSummary) return
    const target = activeSummary
    modal.confirm({
      title: '删除志愿方案',
      icon: <ExclamationCircleFilled style={{ color: C.danger }} />,
      content: (
        <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
          确定删除方案 <strong style={{ color: C.text }}>{target.title}</strong> 吗？
          <br />
          删除后将从你的方案列表中移除，可联系管理员恢复。
        </div>
      ),
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await volunteerPlansApi.remove(target.id)
        } catch (err) {
          const axiosErr = err as AxiosError<{ message?: string }>
          message.error(axiosErr?.response?.data?.message || '删除失败，请重试')
          throw err // 让 modal.confirm 知道 onOk 失败，不关闭
        }
        // 本地状态同步：从 summaries 移除、cache 清条目、active 切到下一个
        setSummaries((prev) => prev.filter((s) => s.id !== target.id))
        setPlanCache((prev) => {
          const next = { ...prev }
          delete next[target.id]
          return next
        })
        setActivePlanId((prevId) => {
          if (prevId !== target.id) return prevId
          const remaining = summaries.filter((s) => s.id !== target.id)
          return remaining.length > 0 ? remaining[0].id : null
        })
        message.success('方案已删除')
      },
    })
  }, [activeSummary, summaries, modal, message])

  // ── 导出 ──────────────────────────────────────────────────────
  const handleExport = async (key: string) => {
    if (!activePlan || !activeSummary) return
    const filename = activeSummary.title

    if (key === 'excel') {
      exportExcel(activePlan, activeDraft.volunteerNotes, filename)
      message.success('导出 Excel 成功')
      return
    }

    // HTML / PDF 需要后端的 rich data。
    const hide = message.loading('正在准备导出数据…', 0)
    let rich: RichVolunteerPlan | undefined
    try {
      const res = await admissionApi.getRichVolunteerPlan(activePlan.id)
      rich = res.data?.data
    } catch {
      hide()
      message.error('获取详细方案数据失败')
      return
    }
    hide()
    if (!rich) {
      message.error('详细方案数据为空')
      return
    }

    if (key === 'html') {
      const blob = new Blob([generateHtmlReport(rich)], { type: 'text/html;charset=utf-8' })
      triggerDownload(blob, `${rich.name}.html`)
      message.success('导出 HTML 成功')
      return
    }
    if (key === 'pdf') {
      const close = message.loading('正在生成 PDF…', 0)
      try {
        await exportPdf(rich)
        message.success('导出 PDF 成功')
      } catch (e) {
        console.error(e)
        message.error('导出 PDF 失败')
      } finally {
        close()
      }
    }
  }

  // ── 表格列定义 ───────────────────────────────────────────────
  // 固定列宽（不再支持拖拽 —— 拖拽列宽在普通用户场景几乎不会被用到）。
  // 移动端通过横向滚动适配（Table scroll.x = 1100）。
  const columns: TableColumnsType<VolunteerTableRow> = useMemo(
    () => [
      groupCol('志愿', ['group', 'orderNo'], 64, 'center'),
      groupCol('院校代码', ['group', 'universityCode'], 96),
      groupCol('院校名称', ['group', 'universityName'], 180),
      groupCol('专业组', ['group', 'groupCode'], 88),
      groupCol('组名', ['group', 'groupName'], 120),
      {
        title: '专业',
        dataIndex: 'majorOrder',
        key: 'majorOrder',
        width: 80,
        align: 'center',
        render: (n: number) => <span style={{ color: C.textSecondary }}>第 {n} 志愿</span>,
      },
      {
        title: '专业代码',
        dataIndex: 'majorCode',
        key: 'majorCode',
        width: 90,
      },
      {
        title: '专业名称',
        dataIndex: 'majorName',
        key: 'majorName',
        width: 220,
      },
      {
        title: '调剂',
        dataIndex: ['group', 'isObeyAdjustment'],
        key: 'isObeyAdjustment',
        width: 80,
        align: 'center',
        onCell: (record) => ({ rowSpan: record.isFirstRow ? 6 : 0 }),
        render: (obey: boolean) =>
          obey ? (
            <span style={{ color: C.success, fontWeight: 500 }}>服从</span>
          ) : (
            <span style={{ color: C.warning }}>不服从</span>
          ),
      },
      {
        title: '备注',
        key: 'note',
        width: 200,
        onCell: (record) => ({ rowSpan: record.isFirstRow ? 6 : 0 }),
        render: (_, record) => {
          const note = activeDraft.volunteerNotes[record.groupKey] ?? record.group.remark ?? ''
          return (
            <Space orientation="vertical" size={2} style={{ width: '100%' }}>
              <Paragraph
                ellipsis={{ rows: 2, tooltip: note || undefined }}
                type={note ? undefined : 'secondary'}
                style={{ marginBottom: 0, fontSize: 13 }}
              >
                {note || '暂无备注'}
              </Paragraph>
              <Button
                size="small"
                type="link"
                icon={<EditOutlined />}
                style={{ padding: 0 }}
                onClick={() => openVolunteerNote(record.groupKey, record.group)}
              >
                编辑
              </Button>
            </Space>
          )
        },
      },
    ],
    // openVolunteerNote / activeDraft 是渲染绑定，必须在依赖里
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDraft],
  )

  // ── 派生展示值 ────────────────────────────────────────────────
  const planCount = summaries.length
  const schoolCount = activeSummary?.school_count ?? activePlan?.plan_json?.stats?.schoolCount ?? 0
  const groupCount = activeSummary?.group_count ?? activePlan?.plan_json?.stats?.groupCount ?? 0

  const saveStatusText = { saved: '已保存', saving: '保存中', failed: '保存失败' }[saveStatus]
  const saveStatusColor = { saved: C.success, saving: C.primary, failed: C.danger }[saveStatus]
  const saveStatusDot = {
    saved: <CheckCircleFilled style={{ color: C.success, fontSize: 13 }} />,
    saving: <LoadingOutlined spin style={{ color: C.primary, fontSize: 13 }} />,
    failed: <CloseCircleFilled style={{ color: C.danger, fontSize: 13 }} />,
  }[saveStatus]

  // ── render ────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 4, fontSize: 28, fontWeight: 600, color: C.text }}>
          志愿填报方案
        </Title>
        <Text style={{ color: C.textSecondary, fontSize: 14 }}>
          查看、编辑、导出已生成的志愿方案。
        </Text>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 280px) 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* 左：方案列表 */}
        <Card
          variant="outlined"
          style={{ borderColor: C.border, boxShadow: SHADOW_CARD }}
          styles={{
            header: { padding: '12px 16px', borderColor: C.border },
            body: { padding: 8 },
          }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: C.primary }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>方案列表</span>
              {planCount > 0 && <CountChip n={planCount} />}
            </div>
          }
        >
          {listLoading && summaries.length === 0 ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : summaries.length === 0 ? (
            <PlanListEmpty />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {summaries.map((summary) => (
                <PlanListItem
                  key={summary.id}
                  id={summary.id}
                  active={activePlanId === summary.id}
                  title={summary.title}
                  note={summary.description}
                  onSelect={handlePlanClick}
                />
              ))}
            </div>
          )}
        </Card>

        {/* 右：方案详情 */}
        <Card
          variant="outlined"
          style={{ borderColor: C.border, boxShadow: SHADOW_CARD, minWidth: 0 }}
          styles={{
            header: { padding: '14px 20px', borderColor: C.border },
            body: { padding: activeSummary ? 16 : 32 },
          }}
          title={
            activeSummary ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: C.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeSummary.title}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    color: saveStatusColor,
                  }}
                  aria-live="polite"
                >
                  {saveStatusDot}
                  {saveStatusText}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>志愿详情</span>
            )
          }
          extra={
            activeSummary && (
              <Space size={8}>
                <Button type="text" icon={<EditOutlined />} onClick={openRename}>
                  重命名
                </Button>
                <Button type="text" icon={<BookOutlined />} onClick={openPlanNote}>
                  方案备注
                </Button>
                <Button type="text" danger icon={<DeleteOutlined />} onClick={handleDelete}>
                  删除
                </Button>
                <Dropdown
                  disabled={!activePlan}
                  menu={{
                    items: [
                      {
                        key: 'excel',
                        icon: <FileExcelOutlined style={{ color: C.success }} />,
                        label: '导出为 Excel',
                      },
                      {
                        key: 'html',
                        icon: <GlobalOutlined style={{ color: '#EA580C' }} />,
                        label: '导出为 HTML',
                      },
                      {
                        key: 'pdf',
                        icon: <FilePdfOutlined style={{ color: C.danger }} />,
                        label: '导出为 PDF',
                      },
                    ],
                    onClick: ({ key }) => handleExport(key),
                  }}
                  placement="bottomRight"
                >
                  <Button type="primary" icon={<ExportOutlined />} loading={detailLoading}>
                    导出
                  </Button>
                </Dropdown>
              </Space>
            )
          }
        >
          {activeSummary ? (
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                }}
              >
                <KpiTile icon={<BankOutlined />} label="目标院校" value={schoolCount} unit="所" />
                <KpiTile icon={<RobotOutlined />} label="专业组" value={groupCount} unit="组" />
                <KpiTile
                  icon={<BookOutlined />}
                  label="专业志愿"
                  value={groupCount * 6}
                  unit="条"
                  hint="每个专业组 6 个专业志愿"
                />
              </div>

              {activeSummary.description && (
                <PlanNoteBanner note={activeSummary.description} onEdit={openPlanNote} />
              )}

              {activePlan ? (
                <Table
                  bordered
                  columns={columns}
                  dataSource={tableData}
                  pagination={false}
                  rowKey="key"
                  scroll={{ x: 1100, y: 'max(360px, calc(100vh - 420px))' }}
                  size="middle"
                  sticky
                />
              ) : (
                <div
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 24,
                    background: C.surface,
                  }}
                >
                  <Skeleton active title={false} paragraph={{ rows: 8, width: '100%' }} />
                </div>
              )}
            </Space>
          ) : (
            <PlansDetailEmpty />
          )}
        </Card>
      </div>

      {/* Modals */}
      <ModernModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        onOk={() => void saveRename()}
        title="重命名方案"
        subtitle="方案名称在你的工作台和导出文件里显示。"
      >
        <Form form={renameForm} layout="vertical">
          <Form.Item
            name="name"
            label="方案名称"
            rules={[{ required: true, message: '请输入方案名称' }]}
          >
            <Input size="large" placeholder="请输入方案名称" maxLength={40} showCount />
          </Form.Item>
        </Form>
      </ModernModal>

      <ModernModal
        open={planNoteOpen}
        onClose={() => setPlanNoteOpen(false)}
        onOk={() => void savePlanNote()}
        title="编辑方案备注"
        subtitle="记录方案的设计思路或核对要点，仅自己可见。"
      >
        <Form form={planNoteForm} layout="vertical">
          <Form.Item name="note" label="方案备注">
            <Input.TextArea
              placeholder="例如：冲档侧重计算机大类，稳档优先 211"
              rows={5}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </ModernModal>

      <ModernModal
        open={Boolean(volunteerNoteTarget)}
        onClose={() => setVolunteerNoteTarget(null)}
        onOk={() => void saveVolunteerNote()}
        title="编辑志愿备注"
        subtitle={
          volunteerNoteTarget
            ? `${volunteerNoteTarget.group.universityName} / ${volunteerNoteTarget.group.groupName}`
            : undefined
        }
        width={640}
      >
        {volunteerNoteTarget && (
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <div
              style={{
                background: C.primarySoft,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: C.textSecondary,
              }}
            >
              院校代码{' '}
              <strong style={{ color: C.text }}>
                {volunteerNoteTarget.group.universityCode}
              </strong>
              {'  ·  '}
              专业组代号{' '}
              <strong style={{ color: C.text }}>{volunteerNoteTarget.group.groupCode}</strong>
            </div>
            <Form form={volunteerNoteForm} layout="vertical" style={{ width: '100%' }}>
              <Form.Item name="note" label="志愿备注">
                <Input.TextArea
                  placeholder="请输入该志愿的核对备注"
                  rows={5}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </Space>
        )}
      </ModernModal>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 表格列工厂：所有按专业组合并的列（每组 6 行 rowSpan 一次）
// ─────────────────────────────────────────────────────────────────
type DataIdx = string | (string | number)[]

function groupCol(
  title: string,
  dataIndex: DataIdx,
  width: number,
  align: 'left' | 'center' | 'right' = 'left',
) {
  return {
    title,
    dataIndex,
    key: String(Array.isArray(dataIndex) ? dataIndex.join('.') : dataIndex),
    width,
    align,
    onCell: (record: VolunteerTableRow) => ({ rowSpan: record.isFirstRow ? 6 : 0 }),
  }
}

// ─────────────────────────────────────────────────────────────────
// 子组件
// ─────────────────────────────────────────────────────────────────
function CountChip({ n }: { n: number }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: C.textSecondary,
        background: C.primarySofter,
        padding: '2px 8px',
        borderRadius: 10,
      }}
    >
      {n}
    </span>
  )
}

const PlanListItem = memo(function PlanListItem({
  id,
  active,
  title,
  note,
  onSelect,
}: {
  id: number
  active: boolean
  title: string
  note: string
  onSelect: (id: number) => void
}) {
  const handleClick = useCallback(() => onSelect(id), [id, onSelect])
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={active ? 'page' : undefined}
      style={{
        position: 'relative',
        textAlign: 'left',
        padding: '12px 14px 12px 18px',
        borderRadius: 8,
        border: `1px solid ${active ? C.primary : 'transparent'}`,
        background: active ? C.primarySoft : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 120ms ease, border-color 120ms ease',
        outline: 'none',
        minHeight: 56,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = C.primarySofter
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.2)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 6,
          top: 14,
          bottom: 14,
          width: 3,
          borderRadius: 2,
          background: active ? C.primary : 'transparent',
          transition: 'background-color 120ms ease',
        }}
      />
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: active ? C.primary : C.text,
          marginBottom: note ? 4 : 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>
      {note && (
        <div
          style={{
            fontSize: 12,
            color: C.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {note}
        </div>
      )}
    </button>
  )
})

function PlanListEmpty() {
  return (
    <div style={{ padding: '20px 12px', textAlign: 'center', color: C.textSecondary, fontSize: 13 }}>
      暂无方案
    </div>
  )
}

function PlansDetailEmpty() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: C.primarySoft,
          color: C.primary,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        <RobotOutlined />
      </div>
      <div>
        <Title level={4} style={{ margin: 0, color: C.text }}>
          还没有志愿方案
        </Title>
        <Paragraph
          style={{
            margin: '6px auto 0',
            maxWidth: 360,
            color: C.textSecondary,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          去「智能填报」开一段对话，AI 会根据你的考生档案自动生成一份冲稳保兼顾的志愿方案。
        </Paragraph>
      </div>
      <Link to="/admission/ai">
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          iconPlacement="end"
          style={{ minHeight: 44, paddingInline: 20 }}
        >
          去生成第一份方案
        </Button>
      </Link>
    </div>
  )
}

function KpiTile({
  icon,
  label,
  value,
  unit,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  hint?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: C.primarySoft,
          color: C.primary,
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
        <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 2 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: C.text,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </span>
          <span style={{ fontSize: 12, color: C.textSecondary }}>{unit}</span>
        </div>
        {hint && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{hint}</div>}
      </div>
    </div>
  )
}

function PlanNoteBanner({ note, onEdit }: { note: string; onEdit: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px',
        background: C.primarySoft,
        border: '1px solid #BFDBFE',
        borderRadius: 8,
      }}
    >
      <BookOutlined style={{ color: C.primary, fontSize: 16, marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginBottom: 2 }}>
          方案备注
        </div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {note}
        </div>
      </div>
      <Button type="text" size="small" icon={<EditOutlined />} onClick={onEdit}>
        编辑
      </Button>
    </div>
  )
}

function ModernModal({
  open,
  onClose,
  onOk,
  title,
  subtitle,
  children,
  width,
}: {
  open: boolean
  onClose: () => void
  onOk: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  width?: number
}) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onOk}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
      width={width ?? 520}
      centered
      title={
        <div style={{ paddingRight: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 13,
                color: C.textSecondary,
                marginTop: 4,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      }
      styles={{
        header: { borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 0 },
        body: { paddingTop: 20, paddingBottom: 4 },
        footer: { borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 16 },
      }}
    >
      {children}
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────
// 导出 helpers
// ─────────────────────────────────────────────────────────────────
function exportExcel(
  plan: UserVolunteerPlan,
  volunteerNotes: Record<string, string>,
  filename: string,
) {
  const groups = plan.plan_json?.groups ?? []
  const rows: Record<string, string | number>[] = []
  groups.forEach((group, idx) => {
    const gKey = groupStableKey(group, idx)
    const noteText = volunteerNotes[gKey] ?? group.remark ?? ''
    for (let i = 1; i <= 6; i++) {
      const major = (group.majors ?? []).find((m) => m.majorOrder === i)
      rows.push({
        志愿顺序: group.orderNo,
        院校代码: group.universityCode,
        院校名称: group.universityName,
        专业组代号: group.groupCode,
        专业组名称: group.groupName,
        专业志愿顺序: `第 ${i} 专业志愿`,
        专业代号: major?.majorCode ?? '',
        专业名称: major?.majorName ?? '',
        专业是否服从调剂: group.isObeyAdjustment ? '服从' : '不服从',
        备注: noteText,
      })
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  // 合并：每组 6 行里相同的列（志愿顺序 / 院校信息 / 调剂 / 备注）合并显示
  const mergeCols = [0, 1, 2, 3, 4, 8, 9]
  const merges: XLSX.Range[] = []
  let cursor = 1 // 跳过 header 行
  groups.forEach(() => {
    const start = cursor
    const end = cursor + 5
    mergeCols.forEach((c) => merges.push({ s: { r: start, c }, e: { r: end, c } }))
    cursor += 6
  })
  if (merges.length > 0) ws['!merges'] = merges

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '志愿方案')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

async function exportPdf(rich: RichVolunteerPlan) {
  // 1. 如果有趋势数据，先把 echarts 渲到离屏 div 拿一张 PNG。
  let chartImageUrl = ''
  const chartData = getChartData(rich)
  if (chartData.hasAnyTrendData) {
    const chartDiv = document.createElement('div')
    chartDiv.style.cssText =
      'position:absolute;top:0;left:-2000px;width:1000px;height:400px;'
    document.body.appendChild(chartDiv)
    try {
      const chart = echarts.init(chartDiv)
      chart.setOption(getChartOptions(chartData))
      await new Promise((r) => setTimeout(r, 200))
      chartImageUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
      chart.dispose()
    } finally {
      document.body.removeChild(chartDiv)
    }
  }

  // 2. 把 HTML 报告 + 图表挂到离屏 div 截图 → 拼 PDF。
  const htmlContent = generateHtmlReport(rich, undefined, chartImageUrl)
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  tempDiv.style.cssText =
    'position:absolute;top:0;left:0;width:1000px;height:auto;overflow:visible;z-index:-1;'
  document.body.appendChild(tempDiv)

  try {
    await new Promise((r) => setTimeout(r, 200))
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    pdf.save(`${rich.name}.pdf`)
  } finally {
    document.body.removeChild(tempDiv)
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
