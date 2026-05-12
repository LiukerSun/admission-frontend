import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent, type ThHTMLAttributes } from 'react'
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import { EditOutlined, FileTextOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import { admissionApi, type VolunteerPlan } from '@/services/admission'

const { Paragraph, Text, Title } = Typography

type PlanDraft = {
  name: string
  note: string
  volunteerNotes: Record<string, string>
}

type VolunteerGroup = {
  key: string
  volunteerOrder: string
  schoolCode: string
  schoolName: string
  groupCode: string
  groupName: string
  adjustment: string
  majors: VolunteerMajor[]
}

type VolunteerMajor = {
  key: string
  majorOrder: string
  majorCode: string
  majorName: string
}

type VolunteerTableRow = VolunteerGroup &
  VolunteerMajor & {
    rowSpan: number
  }

type SaveStatus = 'saved' | 'saving' | 'failed'

type ColumnKey =
  | 'volunteerOrder'
  | 'schoolCode'
  | 'schoolName'
  | 'groupCode'
  | 'groupName'
  | 'majorOrder'
  | 'majorCode'
  | 'majorName'
  | 'adjustment'
  | 'note'

type ResizableTitleProps = ThHTMLAttributes<HTMLTableCellElement> & {
  columnKey?: ColumnKey
  onResizeColumn?: (columnKey: ColumnKey, nextWidth: number) => void
  width?: number
}

const defaultColumnWidths: Record<ColumnKey, number> = {
  volunteerOrder: 92,
  schoolCode: 96,
  schoolName: 170,
  groupCode: 112,
  groupName: 120,
  majorOrder: 136,
  majorCode: 96,
  majorName: 220,
  adjustment: 104,
  note: 260,
}

const minColumnWidths: Record<ColumnKey, number> = {
  volunteerOrder: 72,
  schoolCode: 78,
  schoolName: 120,
  groupCode: 88,
  groupName: 96,
  majorOrder: 108,
  majorCode: 78,
  majorName: 140,
  adjustment: 92,
  note: 180,
}

function ResizableTitle({ columnKey, onResizeColumn, width, children, ...restProps }: ResizableTitleProps) {
  const startResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!columnKey || !width || !onResizeColumn) return

    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = width
    const minWidth = minColumnWidths[columnKey]
    document.body.classList.add('volunteer-table-resizing')

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(minWidth, startWidth + moveEvent.clientX - startX)
      onResizeColumn(columnKey, Math.round(nextWidth))
    }

    const stopResize = () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', stopResize)
      document.body.classList.remove('volunteer-table-resizing')
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', stopResize)
  }

  return (
    <th {...restProps}>
      <span className="volunteer-table-header-title">{children}</span>
      {columnKey && width ? (
        <span
          aria-hidden="true"
          className="volunteer-table-column-resizer"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onPointerDown={startResize}
        />
      ) : null}
    </th>
  )
}

const fieldNames = {
  volunteerOrder: '志愿顺序',
  schoolCode: '院校代码',
  schoolName: '院校名称',
  groupCode: '专业组代号',
  groupName: '专业组名称',
  majorOrder: '专业志愿顺序',
  majorCode: '专业代号',
  majorName: '专业名称',
  adjustment: '专业是否服从调剂',
} as const

function readText(row: Record<string, unknown>, key: string) {
  const value = row[key]
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function buildVolunteerGroups(plan?: VolunteerPlan): VolunteerGroup[] {
  if (!plan) return []

  const groupMap = new Map<string, VolunteerGroup>()

  for (const row of plan.rows) {
    const volunteerOrder = readText(row, fieldNames.volunteerOrder)
    const schoolCode = readText(row, fieldNames.schoolCode)
    const schoolName = readText(row, fieldNames.schoolName)
    const groupCode = readText(row, fieldNames.groupCode)
    const groupName = readText(row, fieldNames.groupName)
    const adjustment = readText(row, fieldNames.adjustment)
    const rowKey = readText(row, 'key')
    const key = [volunteerOrder, schoolCode, groupCode].join('-')

    let group = groupMap.get(key)
    if (!group) {
      group = {
        key,
        volunteerOrder,
        schoolCode,
        schoolName,
        groupCode,
        groupName,
        adjustment,
        majors: [],
      }
      groupMap.set(key, group)
    }

    group.majors.push({
      key: rowKey || `${key}-${group.majors.length}`,
      majorOrder: readText(row, fieldNames.majorOrder),
      majorCode: readText(row, fieldNames.majorCode),
      majorName: readText(row, fieldNames.majorName),
    })
  }

  return Array.from(groupMap.values())
}

function buildTableRows(groups: VolunteerGroup[]): VolunteerTableRow[] {
  return groups.flatMap((group) =>
    group.majors.map((major, index) => ({
      ...group,
      ...major,
      key: major.key,
      rowSpan: index === 0 ? group.majors.length : 0,
    }))
  )
}

function getNoteSummary(note: string) {
  const trimmed = note.trim()
  return trimmed || '暂无备注'
}

function getVolunteerColumnKey(column: TableColumnsType<VolunteerTableRow>[number]): ColumnKey | undefined {
  const dataIndex = 'dataIndex' in column ? column.dataIndex : undefined
  if (typeof dataIndex === 'string' && dataIndex in defaultColumnWidths) {
    return dataIndex as ColumnKey
  }

  const key = 'key' in column ? column.key : undefined
  return key === 'note' ? 'note' : undefined
}

export default function VolunteerPlansPage() {
  const { message } = App.useApp()
  const [plans, setPlans] = useState<VolunteerPlan[]>([])
  const [activePlanId, setActivePlanId] = useState('')
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, PlanDraft>>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [renameOpen, setRenameOpen] = useState(false)
  const [planNoteOpen, setPlanNoteOpen] = useState(false)
  const [volunteerNoteTarget, setVolunteerNoteTarget] = useState<VolunteerGroup | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(defaultColumnWidths)
  const [renameForm] = Form.useForm<{ name: string }>()
  const [planNoteForm] = Form.useForm<{ note: string }>()
  const [volunteerNoteForm] = Form.useForm<{ note: string }>()

  useEffect(() => {
    let isMounted = true

    async function init() {
      try {
        const res = await admissionApi.listVolunteerPlans()
        if (!isMounted) return
        const nextPlans = res.data.data?.plans ?? []
        setPlans(nextPlans)
        setActivePlanId(nextPlans[0]?.id ?? '')
      } catch (error) {
        message.error('获取志愿方案失败')
        console.error(error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void init()
    return () => {
      isMounted = false
    }
  }, [message])

  const activePlan = useMemo(() => {
    return plans.find((plan) => plan.id === activePlanId) ?? plans[0]
  }, [activePlanId, plans])

  const activeDraft = useMemo(() => {
    if (!activePlan) return undefined
    return drafts[activePlan.id] ?? { name: activePlan.name, note: activePlan.description, volunteerNotes: {} }
  }, [activePlan, drafts])

  const volunteerGroups = useMemo(() => buildVolunteerGroups(activePlan), [activePlan])
  const tableRows = useMemo(() => buildTableRows(volunteerGroups), [volunteerGroups])

  const planTitle = activeDraft?.name || activePlan?.name || '志愿详情'
  const planNote = activeDraft?.note ?? ''

  const markSavedSoon = () => {
    setSaveStatus('saving')
    window.setTimeout(() => {
      setSaveStatus('saved')
    }, 350)
  }

  const updateDraft = (planId: string, updater: (draft: PlanDraft) => PlanDraft) => {
    setDrafts((current) => {
      const plan = plans.find((item) => item.id === planId)
      const existing = current[planId] ?? {
        name: plan?.name ?? '',
        note: plan?.description ?? '',
        volunteerNotes: {},
      }

      return {
        ...current,
        [planId]: updater(existing),
      }
    })
    markSavedSoon()
  }

  const openRename = () => {
    renameForm.setFieldsValue({ name: planTitle })
    setRenameOpen(true)
  }

  const openPlanNote = () => {
    planNoteForm.setFieldsValue({ note: planNote })
    setPlanNoteOpen(true)
  }

  const openVolunteerNote = (group: VolunteerGroup) => {
    volunteerNoteForm.setFieldsValue({ note: activeDraft?.volunteerNotes[group.key] ?? '' })
    setVolunteerNoteTarget(group)
  }

  const saveRename = async () => {
    if (!activePlan) return
    const values = await renameForm.validateFields()
    updateDraft(activePlan.id, (draft) => ({ ...draft, name: values.name.trim() || activePlan.name }))
    setRenameOpen(false)
    message.success('方案名称已更新')
  }

  const savePlanNote = async () => {
    if (!activePlan) return
    const values = await planNoteForm.validateFields()
    updateDraft(activePlan.id, (draft) => ({ ...draft, note: values.note }))
    setPlanNoteOpen(false)
    message.success('方案备注已更新')
  }

  const saveVolunteerNote = async () => {
    if (!activePlan || !volunteerNoteTarget) return
    const values = await volunteerNoteForm.validateFields()
    const targetKey = volunteerNoteTarget.key
    updateDraft(activePlan.id, (draft) => ({
      ...draft,
      volunteerNotes: {
        ...draft.volunteerNotes,
        [targetKey]: values.note,
      },
    }))
    setVolunteerNoteTarget(null)
    message.success('志愿备注已更新')
  }

  const columns: TableColumnsType<VolunteerTableRow> = [
    {
      title: '志愿顺序',
      dataIndex: 'volunteerOrder',
      width: 92,
      fixed: 'left',
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (value: string) => value || '-',
    },
    {
      title: '院校代码',
      dataIndex: 'schoolCode',
      width: 96,
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (value: string) => value || '-',
    },
    {
      title: '院校名称',
      dataIndex: 'schoolName',
      width: 170,
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (value: string) => value || '-',
    },
    {
      title: '专业组代号',
      dataIndex: 'groupCode',
      width: 112,
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (value: string) => value || '-',
    },
    {
      title: '专业组名称',
      dataIndex: 'groupName',
      width: 120,
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (value: string) => value || '-',
    },
    {
      title: '专业志愿顺序',
      dataIndex: 'majorOrder',
      width: 136,
      render: (value: string) => value || '-',
    },
    {
      title: '专业代号',
      dataIndex: 'majorCode',
      width: 96,
      render: (value: string) => value || '-',
    },
    {
      title: '专业名称',
      dataIndex: 'majorName',
      width: 220,
      render: (value: string) => value || '-',
    },
    {
      title: '服从调剂',
      dataIndex: 'adjustment',
      width: 104,
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (value: string) => value || '未填写',
    },
    {
      title: '备注',
      key: 'note',
      width: 260,
      fixed: 'right',
      onCell: (row) => ({ rowSpan: row.rowSpan }),
      render: (_, row) => {
        const note = activeDraft?.volunteerNotes[row.key] ?? ''
        return (
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Paragraph
              ellipsis={{ rows: 1, tooltip: note || undefined }}
              type={note ? undefined : 'secondary'}
              style={{ marginBottom: 0, maxWidth: 180 }}
            >
              {getNoteSummary(note)}
            </Paragraph>
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openVolunteerNote(row)}>
              编辑
            </Button>
          </Space>
        )
      },
    },
  ]

  const resizableColumns: TableColumnsType<VolunteerTableRow> = columns.map((column) => {
    const columnKey = getVolunteerColumnKey(column)
    if (!columnKey) return column

    return {
      ...column,
      width: columnWidths[columnKey],
      onHeaderCell: () => ({
        columnKey,
        onResizeColumn: (key: ColumnKey, nextWidth: number) => {
          setColumnWidths((current) => ({
            ...current,
            [key]: nextWidth,
          }))
        },
        width: columnWidths[columnKey],
      }),
    }
  })

  const tableScrollX = Object.values(columnWidths).reduce((total, width) => total + width, 0)

  const saveStatusText = {
    saved: '所有修改已保存',
    saving: '保存中...',
    failed: '保存失败',
  }[saveStatus]

  const saveStatusColor = {
    saved: 'green',
    saving: 'blue',
    failed: 'red',
  }[saveStatus]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>志愿方案核对</Title>
        <Text type="secondary">按志愿顺序核对院校、专业组和专业明细，并补充方案备注。</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={5}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>方案列表</span>
              </Space>
            }
            styles={{ body: { padding: 12 } }}
            loading={loading && plans.length === 0}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              {plans.map((plan) => {
                const draft = drafts[plan.id]
                const displayName = draft?.name || plan.name
                return (
                  <Button
                    key={plan.id}
                    type={activePlanId === plan.id ? 'primary' : 'default'}
                    block
                    onClick={() => setActivePlanId(plan.id)}
                    style={{
                      alignItems: 'flex-start',
                      display: 'flex',
                      flexDirection: 'column',
                      height: 'auto',
                      padding: 12,
                      textAlign: 'left',
                    }}
                  >
                    <Text strong style={{ color: activePlanId === plan.id ? '#fff' : 'inherit', fontSize: 16 }}>
                      {displayName}
                    </Text>
                  </Button>
                )
              })}
              {plans.length === 0 && !loading && <Empty description="暂无生成方案" />}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={19}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <Space>
                  <SendOutlined />
                  <span>{planTitle}</span>
                </Space>
                <Tag color={saveStatusColor} icon={<SaveOutlined />}>
                  {saveStatusText}
                </Tag>
              </div>
            }
            extra={
              activePlan && (
                <Space wrap>
                  <Button icon={<EditOutlined />} onClick={openRename}>
                    重命名
                  </Button>
                  <Button icon={<EditOutlined />} onClick={openPlanNote}>
                    方案备注
                  </Button>
                </Space>
              )
            }
          >
            {activePlan ? (
              <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E9EEF6',
                    borderRadius: 6,
                    padding: 16,
                  }}
                >
                  <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color="blue">院校: {activePlan.stats.schoolCount}</Tag>
                      <Tag color="cyan">专业组: {activePlan.stats.groupCount}</Tag>
                      <Tag color="purple">专业: {activePlan.stats.recordCount}</Tag>
                      <Tag color="geekblue">志愿: {volunteerGroups.length}</Tag>
                    </Space>
                    <Text type={planNote ? undefined : 'secondary'}>{planNote || '暂无方案备注'}</Text>
                  </Space>
                </div>

                <Table
                  bordered
                  columns={resizableColumns}
                  components={{ header: { cell: ResizableTitle } }}
                  dataSource={tableRows}
                  loading={loading}
                  pagination={false}
                  rowKey="key"
                  scroll={{ x: tableScrollX, y: 'calc(100vh - 380px)' }}
                  size="middle"
                  sticky
                />
              </Space>
            ) : (
              <Empty description="暂无生成方案" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="重命名方案"
        open={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onOk={() => void saveRename()}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={renameForm} layout="vertical">
          <Form.Item name="name" label="方案名称" rules={[{ required: true, message: '请输入方案名称' }]}>
            <Input placeholder="请输入方案名称" maxLength={40} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑方案备注"
        open={planNoteOpen}
        onCancel={() => setPlanNoteOpen(false)}
        onOk={() => void savePlanNote()}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={planNoteForm} layout="vertical">
          <Form.Item name="note" label="方案备注">
            <Input.TextArea placeholder="请输入方案备注" rows={5} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={volunteerNoteTarget ? `编辑第 ${volunteerNoteTarget.volunteerOrder} 志愿备注` : '编辑志愿备注'}
        open={Boolean(volunteerNoteTarget)}
        onCancel={() => setVolunteerNoteTarget(null)}
        onOk={() => void saveVolunteerNote()}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        width={640}
      >
        {volunteerNoteTarget && (
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E9EEF6',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <Text strong>
                {volunteerNoteTarget.schoolName} / {volunteerNoteTarget.groupName}
              </Text>
              <div style={{ color: '#64748B', marginTop: 4 }}>
                院校代码 {volunteerNoteTarget.schoolCode} · 专业组代号 {volunteerNoteTarget.groupCode}
              </div>
              <div style={{ marginTop: 12 }}>
                {volunteerNoteTarget.majors.map((major) => (
                  <div key={major.key}>
                    {major.majorOrder} · {major.majorCode} · {major.majorName}
                  </div>
                ))}
              </div>
            </div>
            <Form form={volunteerNoteForm} layout="vertical">
              <Form.Item name="note" label="志愿备注">
                <Input.TextArea placeholder="请输入该志愿的核对备注" rows={5} maxLength={500} showCount />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </div>
  )
}
