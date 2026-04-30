import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { useAuthStore } from '@/stores/authStore'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      await login(values.email, values.password)
      message.success('登录成功')
      navigate('/dashboard')
    } catch {
      message.error('登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="欢迎回来"
      styles={{
        header: { borderBottom: '1px solid var(--color-border)', fontSize: 20, fontWeight: 760 },
        body: { padding: 28 },
      }}
      style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
    >
      <p style={{ marginTop: -8, marginBottom: 24, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
        登录后继续整理志愿计划、查看订单状态和家庭协作进度。
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
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Link to="/forgot-password">忘记密码</Link>
          <span style={{ margin: '0 12px' }}>|</span>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link to="/">返回首页</Link>
        </div>
      </Form>
    </Card>
  )
}
