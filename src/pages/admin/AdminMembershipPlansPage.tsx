import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  adminApi,
  type MembershipPlan,
  type MembershipPlanCreate,
  type MembershipPlanUpdate,
} from '@/services/admin'

const { Title, Text } = Typography

function fenToYuan(fen: number | undefined): number {
  return ((fen ?? 0) / 100)
}

function yuanToFen(yuan: number | undefined): number {
  // 用户输入元，存分。avoid floating point drift on .xx values.
  return Math.round((yuan ?? 0) * 100)
}

interface EditModalState {
  open: boolean
  // 编辑模式 = 有 plan，新建模式 = undefined
  plan?: MembershipPlan
}

export default function AdminMembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<EditModalState>({ open: false })
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.listMembershipPlans()
      setPlans(res.data.data ?? [])
    } catch (err) {
      console.error(err)
      setError('加载套餐失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh() }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  function openCreate() {
    form.resetFields()
    form.setFieldsValue({
      currency: 'CNY',
      status: 'active',
      sort_order: 0,
      price_yuan: 0,
      duration_days: 30,
    })
    setModal({ open: true })
  }

  function openEdit(plan: MembershipPlan) {
    form.resetFields()
    form.setFieldsValue({
      plan_code: plan.plan_code,
      plan_name: plan.plan_name,
      duration_days: plan.duration_days,
      price_yuan: fenToYuan(plan.price_amount),
      currency: plan.currency ?? 'CNY',
      status: plan.status ?? 'active',
      sort_order: plan.sort_order ?? 0,
      description: plan.description ?? '',
    })
    setModal({ open: true, plan })
  }

  function closeModal() {
    setModal({ open: false })
  }

  async function handleSubmit() {
    let values: {
      plan_code: string
      plan_name: string
      duration_days: number
      price_yuan: number
      currency: string
      status: 'active' | 'inactive'
      sort_order: number
      description?: string
    }
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    setSubmitting(true)
    try {
      if (modal.plan) {
        // 编辑：只发送变更字段也行，简化起见把所有可改字段一次发送
        const payload: MembershipPlanUpdate = {
          plan_name: values.plan_name,
          duration_days: values.duration_days,
          price_amount: yuanToFen(values.price_yuan),
          currency: values.currency,
          status: values.status,
          sort_order: values.sort_order,
          description: values.description ?? '',
        }
        await adminApi.updateMembershipPlan(modal.plan.id ?? 0, payload)
        message.success('套餐已更新')
      } else {
        const payload: MembershipPlanCreate = {
          plan_code: values.plan_code,
          plan_name: values.plan_name,
          duration_days: values.duration_days,
          price_amount: yuanToFen(values.price_yuan),
          currency: values.currency || 'CNY',
          status: values.status || 'active',
          sort_order: values.sort_order ?? 0,
          description: values.description ?? '',
        }
        await adminApi.createMembershipPlan(payload)
        message.success('套餐已创建')
      }
      closeModal()
      await refresh()
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      message.error(apiMessage || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus(plan: MembershipPlan, nextActive: boolean) {
    try {
      await adminApi.updateMembershipPlan(plan.id ?? 0, {
        status: nextActive ? 'active' : 'inactive',
      })
      message.success(nextActive ? '已上架' : '已下架')
      await refresh()
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      message.error(apiMessage || '操作失败')
    }
  }

  async function handleDelete(plan: MembershipPlan) {
    try {
      const res = await adminApi.deleteMembershipPlan(plan.id ?? 0)
      const result = res.data.data
      if (result.soft_deleted) {
        Modal.info({
          title: '已下架（无法删除）',
          content: `该套餐被 ${result.reference_rows ?? 0} 个历史订单引用，已转为 inactive 但保留记录。`,
        })
      } else {
        message.success('套餐已删除')
      }
      await refresh()
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      message.error(apiMessage || '删除失败')
    }
  }

  const columns: ColumnsType<MembershipPlan> = [
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 70,
      align: 'center',
      sorter: (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      defaultSortOrder: 'ascend',
      render: (v: number) => v ?? 0,
    },
    {
      title: 'Code',
      dataIndex: 'plan_code',
      width: 120,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '名称',
      dataIndex: 'plan_name',
      render: (v: string, row) => (
        <Space direction="vertical" size={2}>
          <Text strong>{v}</Text>
          {row.description ? (
            <Text type="secondary" style={{ fontSize: 12 }}>{row.description}</Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration_days',
      width: 90,
      align: 'right',
      render: (v: number) => `${v} 天`,
    },
    {
      title: '价格',
      dataIndex: 'price_amount',
      width: 110,
      align: 'right',
      render: (v: number, row) => `¥${fenToYuan(v).toFixed(2)} ${row.currency ?? ''}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: string, row) => (
        <Switch
          checked={s === 'active'}
          checkedChildren="上架"
          unCheckedChildren="下架"
          onChange={(checked) => handleToggleStatus(row, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'right',
      render: (_: unknown, row) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          </Tooltip>
          <Popconfirm
            title="删除该套餐？"
            description="如有订单引用，将转为下架状态而非删除。"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(row)}
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
            套餐管理
          </Title>
          <Text type="secondary">
            编辑 premium 套餐的价格、时长、展示顺序与权益描述。已被订单引用的套餐无法物理删除，会转为下架。
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建套餐</Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
          action={<Button size="small" onClick={refresh}>重试</Button>}
        />
      )}

      <Card>
        <Table
          rowKey={(r) => r.id ?? r.plan_code ?? Math.random()}
          loading={loading}
          dataSource={plans}
          columns={columns}
          pagination={false}
        />
      </Card>

      <Modal
        title={modal.plan ? `编辑套餐：${modal.plan.plan_name}` : '新建套餐'}
        open={modal.open}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!modal.plan && (
            <Form.Item
              name="plan_code"
              label="Plan Code"
              tooltip="业务键，创建后不能修改。例：monthly / semester / lifetime"
              rules={[
                { required: true, message: '请输入 plan_code' },
                { pattern: /^[a-z0-9_]+$/, message: '仅小写字母、数字、下划线' },
                { max: 32 },
              ]}
            >
              <Input placeholder="如 semester" />
            </Form.Item>
          )}
          {modal.plan && (
            <Form.Item label="Plan Code">
              <Tag style={{ fontSize: 13 }}>{modal.plan.plan_code}</Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>不可修改</Text>
            </Form.Item>
          )}

          <Form.Item
            name="plan_name"
            label="名称"
            rules={[{ required: true, message: '请输入套餐名' }, { max: 100 }]}
          >
            <Input placeholder="如 学期会员" />
          </Form.Item>

          <Space.Compact block style={{ marginBottom: 16 }}>
            <Form.Item
              name="duration_days"
              label="时长（天）"
              rules={[{ required: true }, { type: 'number', min: 1 }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber min={1} max={3650} style={{ width: '100%' }} />
            </Form.Item>
            <div style={{ width: 16 }} />
            <Form.Item
              name="price_yuan"
              label="价格（元）"
              rules={[{ required: true }, { type: 'number', min: 0 }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber
                min={0}
                step={1}
                precision={2}
                style={{ width: '100%' }}
                addonBefore="¥"
              />
            </Form.Item>
          </Space.Compact>

          <Space.Compact block style={{ marginBottom: 16 }}>
            <Form.Item
              name="sort_order"
              label="排序"
              tooltip="数字越小越靠前；同值时按 duration_days 升序"
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber min={0} max={9999} style={{ width: '100%' }} />
            </Form.Item>
            <div style={{ width: 16 }} />
            <Form.Item
              name="currency"
              label="货币"
              rules={[{ len: 3, message: '3 位字母代码' }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Input maxLength={3} placeholder="CNY" />
            </Form.Item>
            <div style={{ width: 16 }} />
            <Form.Item
              name="status"
              label="状态"
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Input placeholder="active / inactive" />
            </Form.Item>
          </Space.Compact>

          <Form.Item
            name="description"
            label="权益描述"
            tooltip="展示在前端付费卡片上的简短描述"
          >
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
