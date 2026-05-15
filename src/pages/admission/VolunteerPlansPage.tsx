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
  type TableColumnsType,
} from 'antd'
import { EditOutlined, ExportOutlined, FileTextOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { admissionApi, type VolunteerPlanGroup, type RichVolunteerPlan } from '@/services/admission'
import { volunteerPlansApi, type UserVolunteerPlan } from '@/services/volunteerPlans'
import { Dropdown } from 'antd'
import * as XLSX from 'xlsx'
import { generateHtmlReport, getChartData, getChartOptions } from '@/utils/htmlExportUtils'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import * as echarts from 'echarts'

const { Paragraph, Text, Title } = Typography

type PlanDraft = {
  name: string
  note: string
  volunteerNotes: Record<string, string>
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

type VolunteerTableRow = {
  key: string
  group: VolunteerPlanGroup
  majorOrder: number
  majorCode: string
  majorName: string
  isFirstRow: boolean
}

// 默认列宽汇总 ~1100px。配合右侧 Col lg={19}（79%），在 1366×768 笔记本上
// 也能基本完整展示，不至于强制水平滚动；> 1440 屏一定富余。用户拖动后会
// 覆盖到 columnWidths state，所以这里只是首屏体验保底值。
const defaultColumnWidths: Record<ColumnKey, number> = {
  volunteerOrder: 72,
  schoolCode: 80,
  schoolName: 144,
  groupCode: 88,
  groupName: 100,
  majorOrder: 108,
  majorCode: 80,
  majorName: 168,
  adjustment: 80,
  note: 180,
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

function getVolunteerColumnKey(column: TableColumnsType<VolunteerTableRow>[number]): ColumnKey | undefined {
  const dataIndex = 'dataIndex' in column ? column.dataIndex : undefined

  if (Array.isArray(dataIndex)) {
    const path = dataIndex.join('.')
    if (path === 'group.orderNo') return 'volunteerOrder'
    if (path === 'group.universityCode') return 'schoolCode'
    if (path === 'group.universityName') return 'schoolName'
    if (path === 'group.groupCode') return 'groupCode'
    if (path === 'group.groupName') return 'groupName'
    if (path === 'group.isObeyAdjustment') return 'adjustment'
  }

  if (typeof dataIndex === 'string') {
    if (dataIndex === 'majorOrder') return 'majorOrder'
    if (dataIndex === 'majorCode') return 'majorCode'
    if (dataIndex === 'majorName') return 'majorName'
  }

  const key = 'key' in column ? column.key : undefined
  return key === 'note' ? 'note' : undefined
}

export default function VolunteerPlansPage() {
  const { message } = App.useApp()
  const [plans, setPlans] = useState<UserVolunteerPlan[]>([])
  // V2 plans are keyed by numeric id (was string in V1).
  const [activePlanId, setActivePlanId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<number, PlanDraft>>({})
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [renameOpen, setRenameOpen] = useState(false)
  const [planNoteOpen, setPlanNoteOpen] = useState(false)
  const [volunteerNoteTarget, setVolunteerNoteTarget] = useState<VolunteerPlanGroup | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(defaultColumnWidths)
  const [renameForm] = Form.useForm<{ name: string }>()
  const [planNoteForm] = Form.useForm<{ note: string }>()
  const [volunteerNoteForm] = Form.useForm<{ note: string }>()

  const fetchPlans = async (targetId?: number) => {
    setLoading(true)
    try {
      // Switched to the V2 user-scoped endpoint. The V1
      // admissionApi.listVolunteerPlans returned `{ plans: [...] }`
      // with a `name/description/groups/stats` shape; V2 returns a flat
      // array of `UserVolunteerPlan` where the plan body lives under
      // `plan_json`.
      const res = await volunteerPlansApi.list()
      const newPlans = res.data?.data ?? []
      setPlans(newPlans)
      if (targetId != null) {
        setActivePlanId(targetId)
      } else if (activePlanId == null && newPlans.length > 0) {
        setActivePlanId(newPlans[0].id)
      }
    } catch (error) {
      message.error('获取志愿方案失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        setLoading(true)
        const res = await volunteerPlansApi.list()
        if (isMounted) {
          const newPlans = res.data?.data ?? []
          setPlans(newPlans)
          if (newPlans.length > 0) {
            setActivePlanId(newPlans[0].id)
          }
        }
      } catch {
        // 忽略错误，不做处理
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
  }, [])

  const activePlan = useMemo(() => {
    if (activePlanId == null) return plans[0]
    return plans.find(p => p.id === activePlanId) || plans[0]
  }, [activePlanId, plans])

  const activeDraft = useMemo(() => {
    if (!activePlan) return undefined
    // V2 carries the user-facing title in `plan.title` and stores the
    // structured plan under `plan.plan_json`. There is no separate
    // description column server-side, so the note is purely client-side
    // draft state until a write endpoint exists.
    return (
      drafts[activePlan.id] ?? {
        name: activePlan.title,
        note: '',
        volunteerNotes: {},
      }
    )
  }, [activePlan, drafts])

  const tableData = useMemo(() => {
    if (!activePlan) return []
    const data: VolunteerTableRow[] = []
    ;(activePlan.plan_json?.groups ?? []).forEach((group) => {
      // 每个组固定展示 6 行专业
      for (let i = 1; i <= 6; i++) {
        const major = (group.majors ?? []).find(m => m.majorOrder === i)
        data.push({
          key: `${group.id}-${i}`,
          group,
          majorOrder: i,
          majorCode: major?.majorCode || '',
          majorName: major?.majorName || '',
          isFirstRow: i === 1,
        })
      }
    })
    return data
  }, [activePlan])

  const updateDraft = (planId: number, updater: (draft: PlanDraft) => PlanDraft) => {
    setDrafts((current) => {
      const plan = plans.find((item) => item.id === planId)
      const existing = current[planId] ?? {
        name: plan?.title ?? '',
        note: '',
        volunteerNotes: {},
      }

      return {
        ...current,
        [planId]: updater(existing),
      }
    })
  }

  const openRename = () => {
    renameForm.setFieldsValue({ name: activeDraft?.name || activePlan?.title || '' })
    setRenameOpen(true)
  }

  const openPlanNote = () => {
    planNoteForm.setFieldsValue({ note: activeDraft?.note ?? '' })
    setPlanNoteOpen(true)
  }

  const openVolunteerNote = (group: VolunteerPlanGroup) => {
    volunteerNoteForm.setFieldsValue({ note: activeDraft?.volunteerNotes[group.id] ?? group.remark ?? '' })
    setVolunteerNoteTarget(group)
  }

  const saveRename = async () => {
    if (!activePlan) return
    const values = await renameForm.validateFields()
    const newName = values.name.trim() || activePlan.title
    try {
      setSaveStatus('saving')
      // V2 doesn't yet expose a rename endpoint. Persist optimistically
      // to the client-side draft store so the rename sticks for the
      // session; once a server endpoint exists we can wire it in here.
      updateDraft(activePlan.id, (draft) => ({ ...draft, name: newName }))
      setRenameOpen(false)
      message.success('方案名称已更新（本地）')
      setSaveStatus('saved')
    } catch {
      setSaveStatus('failed')
      message.error('保存失败，请重试')
    }
  }

  const savePlanNote = async () => {
    if (!activePlan) return
    const values = await planNoteForm.validateFields()
    try {
      setSaveStatus('saving')
      // Same situation as rename: keep the note in local draft state
      // until V2 provides a write endpoint.
      updateDraft(activePlan.id, (draft) => ({ ...draft, note: values.note }))
      setPlanNoteOpen(false)
      message.success('方案备注已更新（本地）')
      setSaveStatus('saved')
    } catch {
      setSaveStatus('failed')
      message.error('保存失败，请重试')
    }
  }

  const saveVolunteerNote = async () => {
    if (!activePlan || !volunteerNoteTarget) return
    const values = await volunteerNoteForm.validateFields()
    const targetId = volunteerNoteTarget.id
    try {
      setSaveStatus('saving')
      // Local-only for now (see saveRename). The V1 admissionApi
      // `updateGroupRemark` endpoint operated on V1 group ids and is
      // not compatible with V2 plan_json groups.
      updateDraft(activePlan.id, (draft) => ({
        ...draft,
        volunteerNotes: {
          ...draft.volunteerNotes,
          [targetId]: values.note,
        },
      }))
      setVolunteerNoteTarget(null)
      message.success('志愿备注已更新（本地）')
      setSaveStatus('saved')
    } catch {
      setSaveStatus('failed')
      message.error('保存失败，请重试')
    }
  }

  const handlePlanClick = (id: number) => {
    setActivePlanId(id)
    void fetchPlans(id)
  }

  const tableRows = tableData

  const handleExport = async (key: string) => {
    if (!activePlan) return

    let dataToExport: RichVolunteerPlan | undefined
    if (key === 'html' || key === 'pdf') {
      message.loading('正在准备数据...', 0)
      try {
        const res = await admissionApi.getRichVolunteerPlan(activePlan.id)
        if (res.data?.data) {
          dataToExport = res.data.data
        } else {
          message.error('获取详细方案数据失败')
          return
        }
      } catch {
        message.error('获取详细方案数据失败')
        return
      } finally {
        message.destroy()
      }
      // 删除未使用的 setRichPlanData
      // setRichPlanData(dataToExport)
    }

    switch (key) {
      case 'excel': {
        const excelData = tableData.map(row => ({
          '志愿顺序': row.group.orderNo,
          '院校代码': row.group.universityCode,
          '院校名称': row.group.universityName,
          '专业组代号': row.group.groupCode,
          '专业组名称': row.group.groupName,
          '专业志愿顺序': `第 ${row.majorOrder} 专业志愿`,
          '专业代号': row.majorCode,
          '专业名称': row.majorName,
          '专业是否服从调剂': row.group.isObeyAdjustment ? '服从' : '不服从',
          '备注': activeDraft?.volunteerNotes[row.group.id] ?? row.group.remark ?? '',
        }))

        const ws = XLSX.utils.json_to_sheet(excelData)

        // 设置列宽 (基于当前拖拽后的宽度)
        ws['!cols'] = [
          { wpx: columnWidths.volunteerOrder },
          { wpx: columnWidths.schoolCode },
          { wpx: columnWidths.schoolName },
          { wpx: columnWidths.groupCode },
          { wpx: columnWidths.groupName },
          { wpx: columnWidths.majorOrder },
          { wpx: columnWidths.majorCode },
          { wpx: columnWidths.majorName },
          { wpx: columnWidths.adjustment },
          { wpx: columnWidths.note },
        ]

        // Calculate merges
        const merges: XLSX.Range[] = []
        let currentRow = 1 // Start after header row
        ;(activePlan.plan_json?.groups ?? []).forEach(() => {
          const startRow = currentRow
          const endRow = currentRow + 5 // Each group has 6 rows

          // Columns to merge: 志愿顺序(0), 院校代码(1), 院校名称(2), 专业组代号(3), 专业组名称(4), 专业是否服从调剂(8), 备注(9)
          const mergeCols = [0, 1, 2, 3, 4, 8, 9]

          mergeCols.forEach(colIndex => {
            merges.push({ s: { r: startRow, c: colIndex }, e: { r: endRow, c: colIndex } })
          })
          currentRow += 6
        })

        if (merges.length > 0) {
          ws['!merges'] = merges
        }

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '志愿方案')
        XLSX.writeFile(wb, `${activeDraft?.name || activePlan.title}.xlsx`)
        message.success('导出 Excel 成功')
        break
      }
      case 'html': {
        if (dataToExport) {
          const htmlContent = generateHtmlReport(dataToExport)
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${dataToExport.name}.html`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          message.success('导出 HTML 成功')
        } else {
          message.error('HTML 导出数据未准备好')
        }
        break
      }
      case 'pdf': {
        if (dataToExport) {
          message.loading('正在生成 PDF...', 0)

          // 1. 处理图表转图片
          let chartImageUrl = ''
          const chartData = getChartData(dataToExport)
          if (chartData.hasAnyTrendData) {
            const chartDiv = document.createElement('div')
            chartDiv.style.width = '1000px'
            chartDiv.style.height = '400px'
            chartDiv.style.position = 'absolute'
            chartDiv.style.top = '0'
            chartDiv.style.left = '-2000px'
            document.body.appendChild(chartDiv)

            const chart = echarts.init(chartDiv)
            chart.setOption(getChartOptions(chartData))
            
            // 等待渲染完成
            await new Promise(resolve => setTimeout(resolve, 200))
            
            chartImageUrl = chart.getDataURL({
              type: 'png',
              pixelRatio: 2,
              backgroundColor: '#fff'
            })
            chart.dispose()
            document.body.removeChild(chartDiv)
          }

          // 2. 生成 HTML 内容（传入图表图片）
          const htmlContent = generateHtmlReport(dataToExport, undefined, chartImageUrl)
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = htmlContent
          tempDiv.style.position = 'absolute'
          tempDiv.style.top = '0'
          tempDiv.style.left = '0'
          tempDiv.style.width = '1000px'
          tempDiv.style.height = 'auto'
          tempDiv.style.overflow = 'visible'
          tempDiv.style.zIndex = '-1'
          document.body.appendChild(tempDiv)

          // 等待 DOM 渲染和图片加载
          await new Promise(resolve => setTimeout(resolve, 200))

          html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
          }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
            })
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
            pdf.save(`${dataToExport.name}.pdf`)
            document.body.removeChild(tempDiv)
            message.destroy()
            message.success('导出 PDF 成功')
          }).catch((err) => {
            console.error('PDF generation error:', err)
            message.destroy()
            message.error('导出 PDF 失败')
            if (tempDiv.parentNode) {
              document.body.removeChild(tempDiv)
            }
          })
        } else {
          message.error('PDF 导出数据未准备好')
        }
        break
      }
      default:
        break
    }
  }

  const columns = [
    {
      title: '志愿顺序',
      dataIndex: ['group', 'orderNo'],
      key: 'orderNo',
      width: 80,
      align: 'center' as const,
      onCell: (record: VolunteerTableRow) => ({
        rowSpan: record.isFirstRow ? 6 : 0,
      }),
    },
    {
      title: '院校代码',
      dataIndex: ['group', 'universityCode'],
      key: 'universityCode',
      width: 96,
      onCell: (record: VolunteerTableRow) => ({
        rowSpan: record.isFirstRow ? 6 : 0,
      }),
    },
    {
      title: '院校名称',
      dataIndex: ['group', 'universityName'],
      key: 'universityName',
      width: 190,
      onCell: (record: VolunteerTableRow) => ({
        rowSpan: record.isFirstRow ? 6 : 0,
      }),
    },
    {
      title: '专业组代号',
      dataIndex: ['group', 'groupCode'],
      key: 'groupCode',
      width: 100,
      onCell: (record: VolunteerTableRow) => ({
        rowSpan: record.isFirstRow ? 6 : 0,
      }),
    },
    {
      title: '专业组名称',
      dataIndex: ['group', 'groupName'],
      key: 'groupName',
      width: 120,
      onCell: (record: VolunteerTableRow) => ({
        rowSpan: record.isFirstRow ? 6 : 0,
      }),
    },
    {
      title: '专业志愿顺序',
      dataIndex: 'majorOrder',
      key: 'majorOrder',
      width: 120,
      align: 'center' as const,
      render: (order: number) => `第 ${order} 专业志愿`,
    },
    {
      title: '专业代号',
      dataIndex: 'majorCode',
      key: 'majorCode',
      width: 80,
    },
    {
      title: '专业名称',
      dataIndex: 'majorName',
      key: 'majorName',
      width: 220,
    },
    {
      title: '专业是否服从调剂',
      dataIndex: ['group', 'isObeyAdjustment'],
      key: 'isObeyAdjustment',
      width: 150,
      align: 'center' as const,
      onCell: (record: VolunteerTableRow) => ({
        rowSpan: record.isFirstRow ? 6 : 0,
      }),
      render: (obey: boolean) => obey ? '服从' : '不服从',
    },
    {
      title: '备注',
      key: 'note',
      width: 200,
      onCell: (record: VolunteerTableRow) => ({
        rowSpan: record.isFirstRow ? 6 : 0,
      }),
      render: (_, record: VolunteerTableRow) => {
        const note = activeDraft?.volunteerNotes[record.group.id] ?? record.group.remark ?? ''
        return (
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Paragraph
              ellipsis={{ rows: 2, tooltip: note || undefined }}
              type={note ? undefined : 'secondary'}
              style={{ marginBottom: 0 }}
            >
              {note || '暂无备注'}
            </Paragraph>
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openVolunteerNote(record.group)}>
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
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>志愿填报方案</Title>
        <Text type="secondary">查看已生成的志愿方案详情。</Text>
      </div>
      <Row gutter={[16, 16]}>
        {/* Left Column: Plan Selection — 缩到 lg={5}（21%），把更多横向空间留给右侧的方案明细表 */}
        <Col xs={24} lg={5}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>生成方案列表</span>
              </Space>
            }
            styles={{ body: { padding: '12px' } }}
            loading={loading && plans.length === 0}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              {plans.map((plan) => (
                <Button
                  key={plan.id}
                  type={activePlanId === plan.id ? 'primary' : 'default'}
                  block
                  onClick={() => handlePlanClick(plan.id)}
                  style={{ 
                    textAlign: 'left', 
                    height: 'auto', 
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Text
                    strong
                    style={{
                      color: activePlanId === plan.id ? '#fff' : 'inherit',
                      fontSize: '16px'
                    }}
                  >
                    {drafts[plan.id]?.name || plan.title}
                  </Text>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: '12px',
                      color: activePlanId === plan.id ? 'rgba(255,255,255,0.8)' : 'inherit'
                    }}
                  >
                    {drafts[plan.id]?.note || ''}
                  </Text>
                </Button>
              ))}
              {plans.length === 0 && !loading && (
                <Empty description="暂无生成方案" />
              )}
            </Space>
          </Card>
        </Col>

        {/* Right Column: Data Table — 配合左 lg={5} 占满剩余 19/24，给表格最大横向空间 */}
        <Col xs={24} lg={19}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <SendOutlined />
                  <span>{activeDraft?.name || activePlan?.title || '志愿详情'}</span>
                </Space>
                <Space>
                  <Tag color={saveStatusColor} icon={<SaveOutlined />}>
                    {saveStatusText}
                  </Tag>
                  {activePlan && (
                    <>
                      <Tag color="blue">院校: {activePlan.plan_json?.stats?.schoolCount ?? 0}</Tag>
                      <Tag color="cyan">专业组: {activePlan.plan_json?.stats?.groupCount ?? 0}</Tag>
                    </>
                  )}
                </Space>
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
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'excel', label: '导出为 Excel' },
                        { key: 'html', label: '导出为 HTML' },
                        { key: 'pdf', label: '导出为 PDF' },
                      ],
                      onClick: ({ key }) => handleExport(key),
                    }}
                    placement="bottomRight"
                  >
                    <Button icon={<ExportOutlined />}>导出</Button>
                  </Dropdown>
                </Space>
              )
            }
          >
            {activePlan ? (
              <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                {activeDraft?.note && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E9EEF6',
                      borderRadius: 6,
                      padding: '12px 16px',
                    }}
                  >
                    <Text strong>方案备注：</Text>
                    <Text>{activeDraft.note}</Text>
                  </div>
                )}

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
        title={volunteerNoteTarget ? `编辑志愿备注 - ${volunteerNoteTarget.universityName}` : '编辑志愿备注'}
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
                {volunteerNoteTarget.universityName} / {volunteerNoteTarget.groupName}
              </Text>
              <div style={{ color: '#64748B', marginTop: 4 }}>
                院校代码 {volunteerNoteTarget.universityCode} · 专业组代号 {volunteerNoteTarget.groupCode}
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