import { useEffect, useState, useCallback } from 'react'
import { Table, Input, Select, Button, Space, Tag, message, Modal, Form } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { adminApi, type UserListItem, type AdminUserDetail, type UpdateUserRequest } from '@/services/admin'
import { useAuthStore } from '@/stores/authStore'

const { Option } = Select

interface EditUserFormValues {
  email: string
  username?: string
  role: 'user' | 'premium' | 'admin'
  user_type: 'parent' | 'student'
  status: 'active' | 'banned'
}

interface ResetPasswordFormValues {
  newPassword: string
  confirmPassword: string
}

export default function AdminUsersPage() {
  const { user: currentUser, setUser } = useAuthStore()
  const [form] = Form.useForm<EditUserFormValues>()
  const [passwordForm] = Form.useForm<ResetPasswordFormValues>()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
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
    Modal.confirm({
      title: '确认禁用该用户？',
      onOk: () => {
        adminApi.disableUser(id)
          .then(() => {
            message.success('已禁用')
            fetchUsers()
          })
          .catch(() => message.error('操作失败'))
      },
    })
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

  const buildUpdatePayload = (values: EditUserFormValues): UpdateUserRequest => {
    if (!editingUser) {
      return {}
    }

    const payload: UpdateUserRequest = {}
    const email = values.email.trim()
    const username = values.username?.trim()

    if (email !== editingUser.email) {
      payload.email = email
    }
    if ((username || '') !== (editingUser.username || '')) {
      payload.username = username || undefined
    }
    if (values.role !== editingUser.role) {
      payload.role = values.role
    }
    if (values.user_type !== editingUser.user_type) {
      payload.user_type = values.user_type
    }
    if (values.status !== editingUser.status) {
      payload.status = values.status
    }

    return payload
  }

  const handleEditSubmit = async () => {
    if (!editingUser) {
      return
    }

    try {
      const values = await form.validateFields()
      const payload = buildUpdatePayload(values)

      if (Object.keys(payload).length === 0) {
        message.info('没有需要保存的变更')
        closeEditModal()
        return
      }

      setSaving(true)
      const res = await adminApi.updateUser(editingUser.id, payload)
      const updatedUser = res.data.data

      if (updatedUser.id === currentUser?.id) {
        setUser({
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          user_type: updatedUser.user_type,
          status: updatedUser.status,
          created_at: updatedUser.created_at,
        })
      }

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
    if (!passwordTarget) {
      return
    }

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

  const isEditingSelf = editingUser?.id === currentUser?.id

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '身份类型', dataIndex: 'user_type', key: 'user_type' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        status === 'banned'
          ? <Tag color="red">已封禁</Tag>
          : <Tag color="green">正常</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: UserListItem) => (
        <Space>
          <Button type="link" onClick={() => openEditModal(record.id!)}>
            编辑
          </Button>
          <Button type="link" onClick={() => openPasswordModal(record)}>
            重置密码
          </Button>
          {record.id !== currentUser?.id && (
            record.status === 'banned' ? (
              <Button type="link" onClick={() => handleEnable(record.id!)}>
                启用
              </Button>
            ) : (
              <Button type="link" danger onClick={() => handleDisable(record.id!)}>
                禁用
              </Button>
            )
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2>用户管理</h2>
      <Space wrap style={{ marginBottom: 16, marginTop: 16 }}>
        <Input
          placeholder="邮箱搜索"
          value={filters.email}
          onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          onPressEnter={fetchUsers}
          prefix={<SearchOutlined />}
        />
        <Input
          placeholder="用户名搜索"
          value={filters.username}
          onChange={(e) => setFilters({ ...filters, username: e.target.value })}
          onPressEnter={fetchUsers}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="角色"
          value={filters.role || undefined}
          style={{ width: 120 }}
          onChange={(value) => setFilters({ ...filters, role: value })}
          allowClear
        >
          <Option value="user">user</Option>
          <Option value="premium">premium</Option>
          <Option value="admin">admin</Option>
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
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
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
            rules={[
              { max: 50, message: '用户名不能超过 50 个字符' },
              {
                validator: (_, value) => {
                  if (!value || value.trim().length > 0) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('用户名不能为空字符串'))
                },
              },
            ]}
          >
            <Input placeholder="留空则不修改用户名" disabled={editLoading} />
          </Form.Item>
          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select disabled={editLoading || isEditingSelf}>
              <Option value="user">user</Option>
              <Option value="premium">premium</Option>
              <Option value="admin">admin</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="身份类型"
            name="user_type"
            rules={[{ required: true, message: '请选择身份类型' }]}
          >
            <Select disabled={editLoading}>
              <Option value="parent">parent</Option>
              <Option value="student">student</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择账号状态' }]}
          >
            <Select disabled={editLoading || isEditingSelf}>
              <Option value="active">active</Option>
              <Option value="banned">banned</Option>
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
