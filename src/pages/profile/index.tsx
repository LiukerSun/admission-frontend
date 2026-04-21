import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Descriptions, Form, Input, message } from 'antd'
import { authApi } from '@/services/auth'
import { useAuthStore } from '@/stores/authStore'

interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const [submitting, setSubmitting] = useState(false)

  if (!user) {
    return <div>加载中...</div>
  }

  const handleChangePassword = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await authApi.changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      })
      message.success('密码修改成功，请重新登录')
      form.resetFields()
      logout()
      navigate('/login')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
      const messageText = axiosErr.response?.data?.message?.toLowerCase() || ''

      if (axiosErr.response?.status === 401) {
        message.error('当前密码不正确')
      } else if (axiosErr.response?.status === 400) {
        if (messageText.includes('different')) {
          message.error('新密码不能与当前密码相同')
        } else {
          message.error('密码至少 8 位，且只能包含字母和数字')
        }
      } else if (!('errorFields' in (err as object))) {
        message.error('修改密码失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2>个人中心</h2>
      <Card style={{ marginTop: 24 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="用户 ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="用户名">{user.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">{user.role === 'admin' ? '管理员' : '普通用户'}</Descriptions.Item>
          <Descriptions.Item label="身份类型">{user.user_type === 'parent' ? '家长' : '学生'}</Descriptions.Item>
          <Descriptions.Item label="账号状态">{user.status === 'banned' ? '已封禁' : '正常'}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{new Date(user.created_at).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="修改密码" style={{ marginTop: 24 }}>
        <Alert
          type="info"
          showIcon
          message="密码修改成功后将退出当前登录状态，需要使用新密码重新登录。"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 8, message: '密码至少 8 位' },
              {
                pattern: /^[A-Za-z0-9]+$/,
                message: '密码只能包含字母和数字',
              },
            ]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            dependencies={['currentPassword']}
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少 8 位' },
              {
                pattern: /^[A-Za-z0-9]+$/,
                message: '密码只能包含字母和数字',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('currentPassword') !== value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('新密码不能与当前密码相同'))
                },
              }),
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
          <Button type="primary" loading={submitting} onClick={handleChangePassword}>
            修改密码
          </Button>
        </Form>
      </Card>
    </div>
  )
}
