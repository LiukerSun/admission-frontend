import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Tabs, message } from 'antd'
import type { AxiosError } from 'axios'
import BrandPanel from '@/components/auth/BrandPanel'
import PhoneField from '@/components/auth/PhoneField'
import SmsCodeField from '@/components/auth/SmsCodeField'
import SendCodeButton from '@/components/auth/SendCodeButton'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/auth'
import { isMainlandPhone, normalizeMainlandPhone } from '@/utils/phone'
import './auth.css'

type Mode = 'code' | 'password'

interface PasswordValues {
  phone: string
  password: string
}

interface CodeValues {
  phone: string
  code: string
}

function describeAuthError(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string }>
  const status = axiosErr.response?.status
  const serverMsg = axiosErr.response?.data?.message
  if (status === 401) return '手机号或密码错误'
  if (status === 403) return serverMsg && serverMsg.toLowerCase().includes('banned') ? '账号已被封禁' : '无法登录'
  if (status === 404) return '该手机号尚未注册'
  if (status === 429) return '操作过于频繁，请稍后再试'
  if (status === 409) return '该手机号已被注册'
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

export default function LoginPage() {
  const navigate = useNavigate()
  const loginByPassword = useAuthStore((s) => s.loginByPassword)
  const loginByCode = useAuthStore((s) => s.loginByCode)

  const [mode, setMode] = useState<Mode>('code')
  const [codeForm] = Form.useForm<CodeValues>()
  const [passwordForm] = Form.useForm<PasswordValues>()
  const [submitting, setSubmitting] = useState(false)
  const [otpError, setOtpError] = useState(false)

  const sendCode = async () => {
    const phone = normalizeMainlandPhone(codeForm.getFieldValue('phone') ?? '')
    if (!isMainlandPhone(phone)) {
      codeForm.setFields([{ name: 'phone', errors: ['请输入正确的 11 位手机号'] }])
      throw new Error('invalid phone')
    }
    codeForm.setFields([{ name: 'phone', errors: [] }])
    try {
      await authApi.sendAuthCode({ phone, scene: 'login' })
      message.success('验证码已发送，请查收')
    } catch (err) {
      const text = describeAuthError(err, '验证码发送失败，请稍后再试')
      message.error(text)
      throw err
    }
  }

  const handleCodeSubmit = async (values: CodeValues) => {
    setSubmitting(true)
    setOtpError(false)
    try {
      const phone = normalizeMainlandPhone(values.phone)
      await loginByCode({ phone, code: values.code })
      message.success('登录成功')
      navigate('/dashboard')
    } catch (err) {
      const text = describeAuthError(err, '登录失败，请稍后重试')
      message.error(text)
      // Highlight the OTP cells on a code-related 400.
      const axiosErr = err as AxiosError<{ message?: string }>
      if (axiosErr.response?.status === 400) {
        setOtpError(true)
        codeForm.setFieldValue('code', '')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (values: PasswordValues) => {
    setSubmitting(true)
    try {
      const phone = normalizeMainlandPhone(values.phone)
      await loginByPassword({ phone, password: values.password })
      message.success('登录成功')
      navigate('/dashboard')
    } catch (err) {
      const text = describeAuthError(err, '登录失败，请检查手机号和密码')
      message.error(text)
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
          <h1 className="form-title">欢迎回来</h1>
          <p className="form-subtitle">登录开启你的志愿规划</p>

          <Tabs
            activeKey={mode}
            onChange={(key) => setMode(key as Mode)}
            destroyOnHidden
            items={[
              {
                key: 'code',
                label: '验证码登录',
                children: (
                  <Form
                    form={codeForm}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={handleCodeSubmit}
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

                    <Form.Item label="验证码" required style={{ marginBottom: 6 }}>
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

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                      <button type="submit" className="form-submit" disabled={submitting}>
                        {submitting ? <span className="form-submit-loading">登录中…</span> : '登 录'}
                      </button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'password',
                label: '密码登录',
                children: (
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={handlePasswordSubmit}
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

                    <Form.Item
                      name="password"
                      label="密码"
                      rules={[
                        { required: true, message: '请输入密码' },
                        { min: 8, message: '密码至少 8 位' },
                        { pattern: /^[a-zA-Z0-9]+$/, message: '密码仅支持字母和数字' },
                      ]}
                    >
                      <Input.Password placeholder="至少 8 位字母与数字" size="large" />
                    </Form.Item>

                    <div className="form-meta">
                      <span />
                      <span style={{ cursor: 'not-allowed' }} title="如忘记密码请用验证码登录">忘记密码？</span>
                    </div>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <button type="submit" className="form-submit" disabled={submitting}>
                        {submitting ? <span className="form-submit-loading">登录中…</span> : '登 录'}
                      </button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />

          <p className="form-foot">
            还没有账号？<Link to="/register">立即注册</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
