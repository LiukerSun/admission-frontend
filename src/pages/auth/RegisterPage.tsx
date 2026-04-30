import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message, Radio } from 'antd'
import { useAuthStore } from '@/stores/authStore'

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  userType: 'parent' | 'student'
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: RegisterForm) => {
    setLoading(true)
    try {
      await register(values.email, values.password, values.userType)
      message.success('注册成功，已自动登录')
      navigate('/dashboard')
    } catch {
      message.error('注册失败，该邮箱可能已被注册')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="创建账号"
      styles={{
        header: { borderBottom: '1px solid var(--color-border)', fontSize: 20, fontWeight: 760 },
        body: { padding: 28 },
      }}
      style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
    >
      <p style={{ marginTop: -8, marginBottom: 24, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
        选择家长或学生身份，后续可通过绑定关系协同查看填报进度。
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
          rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少 8 位' }]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          rules={[
            { required: true, message: '请再次输入密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入密码" />
        </Form.Item>

        <Form.Item
          label="身份类型"
          name="userType"
          rules={[{ required: true, message: '请选择身份类型' }]}
        >
          <Radio.Group>
            <Radio value="parent">我是家长</Radio>
            <Radio value="student">我是学生</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            注册
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          已有账号？<Link to="/login">立即登录</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link to="/">返回首页</Link>
        </div>
      </Form>
    </Card>
  )
}
