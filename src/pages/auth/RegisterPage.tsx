import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Checkbox, Form, Input, message } from 'antd'
import type { AxiosError } from 'axios'
import BrandPanel from '@/components/auth/BrandPanel'
import PhoneField from '@/components/auth/PhoneField'
import SmsCodeField from '@/components/auth/SmsCodeField'
import SendCodeButton from '@/components/auth/SendCodeButton'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/auth'
import { isMainlandPhone, normalizeMainlandPhone } from '@/utils/phone'
import './auth.css'

interface RegisterValues {
  phone: string
  code: string
  password: string
  confirmPassword: string
  agree: boolean
}

function describeRegisterError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  const status = axiosErr.response?.status
  const serverMsg = axiosErr.response?.data?.message
  if (status === 409) return '该手机号已被注册，请直接登录'
  if (status === 429) return '操作过于频繁，请稍后再试'
  if (status === 400 && serverMsg) {
    if (serverMsg.includes('invalid verification code')) return '验证码错误'
    if (serverMsg.includes('expired')) return '验证码已过期，请重新获取'
    if (serverMsg.includes('attempts exceeded')) return '尝试次数过多，请重新获取验证码'
    if (serverMsg.includes('invalid phone')) return '请输入正确的手机号'
    if (serverMsg.includes('too frequently')) return '操作过于频繁，请稍后再试'
    if (serverMsg.includes('daily limit')) return '今日验证码次数已达上限'
  }
  return fallback
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [form] = Form.useForm<RegisterValues>()
  const [submitting, setSubmitting] = useState(false)
  const [otpError, setOtpError] = useState(false)

  const sendCode = async () => {
    const phone = normalizeMainlandPhone(form.getFieldValue('phone') ?? '')
    if (!isMainlandPhone(phone)) {
      form.setFields([{ name: 'phone', errors: ['请输入正确的 11 位手机号'] }])
      throw new Error('invalid phone')
    }
    form.setFields([{ name: 'phone', errors: [] }])
    try {
      await authApi.sendAuthCode({ phone, scene: 'register' })
      message.success('验证码已发送，请查收')
    } catch (err) {
      const text = describeRegisterError(err, '验证码发送失败，请稍后再试')
      message.error(text)
      throw err
    }
  }

  const handleSubmit = async (values: RegisterValues) => {
    if (!values.agree) {
      message.warning('请先同意服务协议与隐私政策')
      return
    }
    setSubmitting(true)
    setOtpError(false)
    try {
      const phone = normalizeMainlandPhone(values.phone)
      await register({ phone, code: values.code, password: values.password })
      message.success('账号创建成功，已自动登录')
      navigate('/dashboard')
    } catch (err) {
      const text = describeRegisterError(err, '注册失败，请稍后再试')
      message.error(text)
      const axiosErr = err as AxiosError<{ message?: string }>
      if (axiosErr.response?.status === 400) {
        setOtpError(true)
        form.setFieldValue('code', '')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <BrandPanel />

      <main className="form-panel">
        <Link to="/" className="form-back">← 返回首页</Link>

        <div className="form-card">
          <h1 className="form-title">创建账号</h1>
          <p className="form-subtitle">用手机号注册，3 步开启志愿规划</p>

          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ agree: false }}
            onFinish={handleSubmit}
            onValuesChange={() => setOtpError(false)}
          >
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                {
                  validator: (_, v) =>
                    isMainlandPhone(v ?? '')
                      ? Promise.resolve()
                      : Promise.reject(new Error('请输入正确的 11 位手机号')),
                },
              ]}
            >
              <PhoneField placeholder="13800138000" autoFocus />
            </Form.Item>

            <Form.Item label="验证码" required style={{ marginBottom: 18 }}>
              <div className="sms-row">
                <Form.Item
                  name="code"
                  noStyle
                  rules={[
                    { required: true, message: '请输入验证码' },
                    { len: 6, message: '验证码为 6 位数字' },
                  ]}
                >
                  <SmsCodeField hasError={otpError} />
                </Form.Item>
                <SendCodeButton onSend={sendCode} />
              </div>
            </Form.Item>

            <Form.Item
              name="password"
              label="设置密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少 8 位' },
                { pattern: /^[a-zA-Z0-9]+$/, message: '密码仅支持字母和数字' },
              ]}
            >
              <Input.Password placeholder="至少 8 位字母与数字" size="large" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
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
              <Input.Password placeholder="再次输入密码" size="large" />
            </Form.Item>

            <Form.Item
              name="agree"
              valuePropName="checked"
              style={{ marginBottom: 4 }}
            >
              <Checkbox>
                <span className="form-agreement">
                  我已阅读并同意
                  <a href="#" onClick={(e) => e.preventDefault()}> 用户服务协议</a>
                  与
                  <a href="#" onClick={(e) => e.preventDefault()}> 隐私政策</a>
                </span>
              </Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <button type="submit" className="form-submit" disabled={submitting}>
                {submitting ? <span className="form-submit-loading">创建中…</span> : '创建账号'}
              </button>
            </Form.Item>
          </Form>

          <p className="form-foot">
            已有账号？<Link to="/login">立即登录</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
