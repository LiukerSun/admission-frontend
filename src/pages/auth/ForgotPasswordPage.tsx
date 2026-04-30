import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { authApi } from '@/services/auth'

interface ForgotPasswordForm {
  email: string
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onFinish = async (values: ForgotPasswordForm) => {
    setLoading(true)
    try {
      await authApi.forgotPassword({ email: values.email })
      setSent(true)
    } catch {
      message.error('请求失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card
        title="邮件已发送"
        styles={{
          header: { borderBottom: '1px solid var(--color-border)', fontSize: 20, fontWeight: 760 },
          body: { padding: 28 },
        }}
        style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
      >
        <p style={{ marginTop: -8, marginBottom: 24, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          如果该邮箱已注册，您将收到一封包含重置密码链接的邮件。请检查您的收件箱（以及垃圾邮件文件夹）。
        </p>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login">返回登录</Link>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="找回密码"
      styles={{
        header: { borderBottom: '1px solid var(--color-border)', fontSize: 20, fontWeight: 760 },
        body: { padding: 28 },
      }}
      style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
    >
      <p style={{ marginTop: -8, marginBottom: 24, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
        请输入注册时使用的邮箱，我们将向您发送重置密码的链接。
      </p>
      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input placeholder="请输入注册邮箱" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            发送重置链接
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          想起密码了？<Link to="/login">返回登录</Link>
        </div>
      </Form>
    </Card>
  )
}
