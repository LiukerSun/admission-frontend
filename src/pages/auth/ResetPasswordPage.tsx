import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { authApi } from '@/services/auth'

interface ResetPasswordForm {
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: ResetPasswordForm) => {
    if (!token) {
      message.error('重置链接无效，请重新申请')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, new_password: values.newPassword })
      message.success('密码已重置，请重新登录')
      navigate('/login')
    } catch {
      message.error('重置失败，链接可能已过期')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Card
        title="无效链接"
        styles={{
          header: { borderBottom: '1px solid var(--color-border)', fontSize: 20, fontWeight: 760 },
          body: { padding: 28 },
        }}
        style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
      >
        <p style={{ marginTop: -8, marginBottom: 24, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          密码重置链接无效，请重新申请重置密码。
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link to="/forgot-password">重新申请</Link>
          <span style={{ margin: '0 12px' }}>|</span>
          <Link to="/login">返回登录</Link>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="重置密码"
      styles={{
        header: { borderBottom: '1px solid var(--color-border)', fontSize: 20, fontWeight: 760 },
        body: { padding: 28 },
      }}
      style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
    >
      <p style={{ marginTop: -8, marginBottom: 24, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
        请输入您的新密码。
      </p>
      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码至少 8 位' },
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          rules={[
            { required: true, message: '请再次输入密码' },
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

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            重置密码
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">返回登录</Link>
        </div>
      </Form>
    </Card>
  )
}
