import { useEffect, useState, useCallback } from 'react'
import {
  Table, Input, Select, Button, Space, Tag, message, Modal, Form,
  Card, Row, Col, Statistic, Dropdown, Popconfirm, Tooltip, Switch,
} from 'antd'
import {
  SearchOutlined, DownloadOutlined, ReloadOutlined,
  TeamOutlined, UserAddOutlined, StopOutlined, MoreOutlined,
  LockOutlined, EditOutlined,
} from '@ant-design/icons'
import { adminApi, type UserListItem, type AdminUserDetail, type UpdateUserRequest } from '@/services/admin'
import { useAuthStore } from '@/stores/authStore'
import { buildAdminUserUpdatePayload, canChangeAdminPermission } from '@/utils/adminUsers'
import type { MenuProps } from 'antd'

const { Option } = Select

interface EditUserFormValues {
  email: string
  username?: string
  role: 'user' | 'premium'
  is_admin: boolean
  user_type: 'parent' | 'student'
  status: 'active' | 'banned'
}

interface ResetPasswordFormValues {
  newPassword: string
  confirmPassword: string
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const [form] = Form.useForm<EditUserFormValues>()
  const [passwordForm] = Form.useForm<ResetPasswordFormValues>()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingUser, setEditingUser] = useState<AdminUserDetail | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<UserListItem | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [filters, setFilters] = useState({
    email: '',
    username: '',
    role: '',
    is_admin: undefined as boolean | undefined,
    status: '',
  })

  const fetchUsers = useCallback(() => {
    setLoading(true)
    adminApi.getUsers({
      page,
      page_size: pageSize,
      ...filters,
    })
      .then((res) => {
        setUsers(res.data.data.users ?? [])
        setTotal(res.data.data.total ?? 0)
      })
      .catch(() => message.error('加载用户列表失败'))
      .finally(() => setLoading(false))
  }, [page, pageSize, filters])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchUsers])

  const handleDisable = (id: number) => {
    adminApi.disableUser(id)
      .then(() => {
        message.success('已禁用')
        fetchUsers()
      })
      .catch(() => message.error('操作失败'))
  }

  const handleEnable = (id: number) => {
    adminApi.enableUser(id)
      .then(() => {
        message.success('已启用')
        fetchUsers()
      })
      .catch(() => message.error('操作失败'))
  }

  const openEditModal = async (id: number) => {
    setEditModalOpen(true)
    setEditLoading(true)
    form.resetFields()
    try {
      const res = await adminApi.getUser(id)
      const detail = res.data.data
      setEditingUser(detail)
      form.setFieldsValue({
        email: detail.email,
        username: detail.username || '',
        role: detail.role,
        is_admin: Boolean(detail.is_admin),
        user_type: detail.user_type,
        status: detail.status,
      })
    } catch {
      message.error('加载用户详情失败')
      setEditModalOpen(false)
    } finally {
      setEditLoading(false)
    }
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingUser(null)
    setEditLoading(false)
    setSaving(false)
    form.resetFields()
  }

  const openPasswordModal = (user: UserListItem) => {
    setPasswordTarget(user)
    setPasswordModalOpen(true)
    passwordForm.resetFields()
  }

  const closePasswordModal = () => {
    setPasswordTarget(null)
    setPasswordModalOpen(false)
    setPasswordSaving(false)
    passwordForm.resetFields()
  }

  const buildUpdatePayload = (values: EditUserFormValues): UpdateUserRequest =>
    editingUser ? buildAdminUserUpdatePayload(editingUser, values, currentUser?.id) : {}

  const handleEditSubmit = async () => {
    if (!editingUser) return
    try {
      const values = await form.validateFields()
      const payload = buildUpdatePayload(values)
      if (Object.keys(payload).length === 0) {
        message.info('没有需要保存的变更')
        closeEditModal()
        return
      }
      setSaving(true)
      await adminApi.updateUser(editingUser.id, payload)
      message.success('用户信息已更新')
      closeEditModal()
      fetchUsers()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 409) {
        message.error('邮箱或用户名已存在')
      } else if (!('errorFields' in (err as object))) {
        message.error('更新用户失败')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!passwordTarget) return
    try {
      const values = await passwordForm.validateFields()
      setPasswordSaving(true)
      await adminApi.resetPassword(passwordTarget.id!, {
        new_password: values.newPassword,
      })
      message.success('密码已重置，用户需重新登录')
      closePasswordModal()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 400) {
        message.error('新密码至少 8 位，且只能包含字母和数字')
      } else if (!('errorFields' in (err as object))) {
        message.error('重置密码失败')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleBatchDisable = () => {
    Modal.confirm({
      title: `确认禁用选中的 ${selectedRowKeys.length} 个用户？`,
      onOk: () => {
        Promise.all(selectedRowKeys.map(id => adminApi.disableUser(Number(id))))
          .then(() => {
            message.success('批量禁用成功')
            setSelectedRowKeys([])
            fetchUsers()
          })
          .catch(() => message.error('批量禁用失败'))
      },
    })
  }

  const handleBatchEnable = () => {
    Promise.all(selectedRowKeys.map(id => adminApi.enableUser(Number(id))))
      .then(() => {
        message.success('批量启用成功')
        setSelectedRowKeys([])
        fetchUsers()
      })
      .catch(() => message.error('批量启用失败'))
  }

  const handleExport = () => {
    const exportData = selectedRowKeys.length > 0
      ? users.filter(u => selectedRowKeys.includes(u.id!))
      : users
    const csv = [
      ['ID', '用户名', '邮箱', '会员等级', '管理员权限', '身份类型', '状态', '注册时间'].join(','),
      ...exportData.map(u => [
        u.id, u.username, u.email, u.role, u.is_admin ? '管理员' : '普通用户', u.user_type,
        u.status === 'banned' ? '已封禁' : '正常',
        u.created_at ? new Date(u.created_at).toLocaleString() : '-',
      ].join(',')),
    ].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `用户列表_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const isEditingSelf = editingUser?.id === currentUser?.id

  const roleTagColor: Record<string, string> = {
    premium: 'orange',
    user: 'blue',
  }

  const userTypeMap: Record<string, string> = {
    parent: '家长',
    student: '学生',
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (v: string) => v || '-',
    },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '会员等级',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'user', value: 'user' },
        { text: 'premium', value: 'premium' },
      ],
      onFilter: (value: string, record: UserListItem) => record.role === value,
      render: (v: string) => <Tag color={roleTagColor[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '管理员权限',
      dataIndex: 'is_admin',
      key: 'is_admin',
      filters: [
        { text: '管理员', value: true },
        { text: '普通用户', value: false },
      ],
      onFilter: (value: boolean, record: UserListItem) => Boolean(record.is_admin) === value,
      render: (v: boolean) => (
        v ? <Tag color="red">管理员</Tag> : <Tag>普通用户</Tag>
      ),
    },
    {
      title: '身份类型',
      dataIndex: 'user_type',
      key: 'user_type',
      render: (v: string) => userTypeMap[v] || v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '正常', value: 'active' },
        { text: '已封禁', value: 'banned' },
      ],
      onFilter: (value: string, record: UserListItem) => record.status === value,
      render: (status: string) => (
        status === 'banned'
          ? <Tag color="error">已封禁</Tag>
          : <Tag color="success">正常</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a: UserListItem, b: UserListItem) =>
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: UserListItem) => {
        const items: MenuProps['items'] = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑',
            onClick: () => openEditModal(record.id!),
          },
          {
            key: 'password',
            icon: <LockOutlined />,
            label: '重置密码',
            onClick: () => openPasswordModal(record),
          },
          { type: 'divider' as const },
          record.id !== currentUser?.id && record.status === 'banned'
            ? {
                key: 'enable',
                icon: <UserAddOutlined />,
                label: '启用',
                onClick: () => handleEnable(record.id!),
              }
            : record.id !== currentUser?.id
              ? {
                  key: 'disable',
                  icon: <StopOutlined />,
                  label: '禁用',
                  danger: true,
                  onClick: () => handleDisable(record.id!),
                }
              : null,
        ].filter(Boolean)

        return (
          <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  const activeCount = users.filter(u => u.status === 'active').length
  const bannedCount = users.filter(u => u.status === 'banned').length

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>用户管理</h2>
      <p style={{ color: '#64748B', marginBottom: 24 }}>
        管理平台注册用户，支持批量操作和数据导出
      </p>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总用户"
              value={total}
              prefix={<TeamOutlined style={{ color: '#1E40AF' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="正常"
              value={activeCount}
              prefix={<UserAddOutlined style={{ color: '#16A34A' }} />}
              valueStyle={{ color: '#16A34A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="已封禁"
              value={bannedCount}
              prefix={<StopOutlined style={{ color: '#DC2626' }} />}
              valueStyle={{ color: '#DC2626' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="用户列表"
        extra={
          <Space>
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={fetchUsers} />
            </Tooltip>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出{selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="邮箱搜索"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            onPressEnter={fetchUsers}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Input
            placeholder="用户名搜索"
            value={filters.username}
            onChange={(e) => setFilters({ ...filters, username: e.target.value })}
            onPressEnter={fetchUsers}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Select
            placeholder="会员等级"
            value={filters.role || undefined}
            style={{ width: 120 }}
            onChange={(value) => setFilters({ ...filters, role: value })}
            allowClear
          >
            <Option value="user">user</Option>
            <Option value="premium">premium</Option>
          </Select>
          <Select
            placeholder="管理员权限"
            value={filters.is_admin}
            style={{ width: 140 }}
            onChange={(value) => setFilters({ ...filters, is_admin: value })}
            allowClear
          >
            <Option value={true}>管理员</Option>
            <Option value={false}>普通用户</Option>
          </Select>
          <Select
            placeholder="状态"
            value={filters.status || undefined}
            style={{ width: 120 }}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
          >
            <Option value="active">正常</Option>
            <Option value="banned">已封禁</Option>
          </Select>
          <Button type="primary" onClick={fetchUsers}>
            搜索
          </Button>
          <Button onClick={() => { setFilters({ email: '', username: '', role: '', is_admin: undefined, status: '' }); setPage(1) }}>
            重置
          </Button>
        </Space>

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16, padding: '8px 16px', background: '#EFF6FF', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#1E40AF', fontWeight: 500 }}>
              已选择 {selectedRowKeys.length} 项
            </span>
            <Button size="small" onClick={handleBatchEnable}>批量启用</Button>
            <Popconfirm title="确认禁用选中用户？" onConfirm={handleBatchDisable}>
              <Button size="small" danger>批量禁用</Button>
            </Popconfirm>
            <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </div>
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={editingUser ? `编辑用户 #${editingUser.id}` : '编辑用户'}
        open={editModalOpen}
        onCancel={closeEditModal}
        onOk={handleEditSubmit}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" disabled={editLoading} />
          </Form.Item>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ max: 50, message: '用户名不能超过 50 个字符' }]}
          >
            <Input placeholder="留空则不修改用户名" disabled={editLoading} />
          </Form.Item>
          <Form.Item
            label="会员等级"
            name="role"
            rules={[{ required: true, message: '请选择会员等级' }]}
          >
            <Select disabled={editLoading}>
              <Option value="user">user</Option>
              <Option value="premium">premium</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="管理员权限"
            name="is_admin"
            valuePropName="checked"
            tooltip={isEditingSelf ? '不能在前端撤销自己的管理员权限' : undefined}
          >
            <Switch
              disabled={editLoading || !canChangeAdminPermission(editingUser?.id, currentUser?.id)}
              checkedChildren="管理员"
              unCheckedChildren="普通用户"
            />
          </Form.Item>
          <Form.Item
            label="身份类型"
            name="user_type"
            rules={[{ required: true, message: '请选择身份类型' }]}
          >
            <Select disabled={editLoading}>
              <Option value="parent">家长</Option>
              <Option value="student">学生</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择账号状态' }]}
          >
            <Select disabled={editLoading || isEditingSelf}>
              <Option value="active">正常</Option>
              <Option value="banned">已封禁</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={passwordTarget ? `重置密码 #${passwordTarget.id}` : '重置密码'}
        open={passwordModalOpen}
        onCancel={closePasswordModal}
        onOk={handleResetPassword}
        confirmLoading={passwordSaving}
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical" autoComplete="off">
          <Form.Item label="用户邮箱">
            <Input value={passwordTarget?.email} disabled />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少 8 位' },
              {
                pattern: /^[A-Za-z0-9]+$/,
                message: '密码只能包含字母和数字',
              },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
