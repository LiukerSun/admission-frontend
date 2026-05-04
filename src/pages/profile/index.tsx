import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  LockOutlined,
  MobileOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import FamilyBindingsPanel from '@/features/account-center/FamilyBindingsPanel'
import MembershipOrdersPanel from '@/features/account-center/MembershipOrdersPanel'
import { authApi } from '@/services/auth'
import { useAuthStore } from '@/stores/authStore'
import { getAccountCenterTab, type AccountCenterTab } from '@/utils/accountCenter'
import { isMainlandPhone, normalizeMainlandPhone } from '@/utils/phone'

interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PhoneFormValues {
  phone: string
  code: string
}

function getPhoneErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
  const status = axiosErr.response?.status
  const messageText = axiosErr.response?.data?.message?.toLowerCase() || ''

  if (status === 401) {
    return '登录状态已失效，请重新登录'
  }
  if (status === 409 || messageText.includes('phone already exists')) {
    return '该手机号已被占用'
  }
  if (messageText.includes('invalid phone number')) {
    return '手机号格式不正确'
  }
  if (messageText.includes('too frequently')) {
    return '验证码发送过于频繁，请稍后再试'
  }
  if (messageText.includes('daily limit')) {
    return '今日验证码发送次数已达上限'
  }
  if (messageText.includes('not found') || messageText.includes('expired')) {
    return '验证码已过期，请重新发送'
  }
  if (messageText.includes('attempts exceeded')) {
    return '验证码尝试次数过多，请重新发送'
  }
  if (messageText.includes('invalid verification code')) {
    return '验证码错误'
  }

  return fallback
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, logout, refreshUser } = useAuthStore()
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const [phoneForm] = Form.useForm<PhoneFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownTimerRef = useRef<number | null>(null)
  const activeTab = getAccountCenterTab(searchParams.get('tab'))

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current)
      }
    }
  }, [])

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

  const startCountdown = () => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
    }

    setCountdown(60)
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (countdownTimerRef.current !== null) {
            window.clearInterval(countdownTimerRef.current)
            countdownTimerRef.current = null
          }
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  const handleSendPhoneCode = async () => {
    try {
      const { phone } = await phoneForm.validateFields(['phone'])
      const normalizedPhone = normalizeMainlandPhone(phone)
      setSendingCode(true)
      await authApi.sendPhoneCode({ phone: normalizedPhone })
      phoneForm.setFieldsValue({ phone: normalizedPhone })
      message.success('验证码已发送')
      startCountdown()
    } catch (err: unknown) {
      if (!('errorFields' in (err as object))) {
        message.error(getPhoneErrorMessage(err, '发送验证码失败'))
      }
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyPhone = async () => {
    try {
      const values = await phoneForm.validateFields()
      const normalizedPhone = normalizeMainlandPhone(values.phone)
      setVerifyingPhone(true)
      await authApi.verifyPhoneCode({
        phone: normalizedPhone,
        code: values.code,
      })
      await refreshUser()
      phoneForm.setFieldsValue({ phone: normalizedPhone, code: '' })
      message.success('手机号绑定成功')
    } catch (err: unknown) {
      if (!('errorFields' in (err as object))) {
        message.error(getPhoneErrorMessage(err, '手机号绑定失败'))
      }
    } finally {
      setVerifyingPhone(false)
    }
  }

  const phoneBound = Boolean(user.phone && user.phone_verified)

  const profileSummaryCard = (
    <Card>
      <Space size={24} align="center" wrap>
        <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1E40AF' }} />
        <Space direction="vertical" size={4}>
          <Typography.Text strong style={{ fontSize: 18 }}>
            {user.username || user.email.split('@')[0]}
          </Typography.Text>
          <Space size={8} wrap>
            <Typography.Text type="secondary">{user.email}</Typography.Text>
            <Tag color={user.is_admin ? 'blue' : 'default'}>
              {user.is_admin ? '管理员' : '普通用户'}
            </Tag>
            {phoneBound && (
              <Tag color="success" icon={<LockOutlined style={{ fontSize: 12 }} />}>
                手机号已验证
              </Tag>
            )}
          </Space>
        </Space>
      </Space>
    </Card>
  )

  const basicInfoPanel = (
    <Descriptions
      column={{ xs: 1, sm: 2 }}
      labelStyle={{ color: '#64748B', width: 100 }}
      contentStyle={{ fontWeight: 500 }}
    >
      <Descriptions.Item label="用户 ID">{user.id}</Descriptions.Item>
      <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
      <Descriptions.Item label="用户名">{user.username || '-'}</Descriptions.Item>
      <Descriptions.Item label="手机号">{user.phone || '-'}</Descriptions.Item>
      <Descriptions.Item label="手机号状态">
        {user.phone_verified ? <Tag color="success">已验证</Tag> : <Tag>未验证</Tag>}
      </Descriptions.Item>
      <Descriptions.Item label="管理员权限">
        <Tag color={user.is_admin ? 'blue' : 'default'}>
          {user.is_admin ? '管理员' : '普通用户'}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="身份类型">
        {user.user_type === 'parent' ? '家长' : '学生'}
      </Descriptions.Item>
      <Descriptions.Item label="账号状态">
        <Tag color={user.status === 'banned' ? 'error' : 'success'}>
          {user.status === 'banned' ? '已封禁' : '正常'}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="注册时间">
        {new Date(user.created_at).toLocaleString()}
      </Descriptions.Item>
    </Descriptions>
  )

  const passwordPanel = (
    <div style={{ maxWidth: 520 }}>
      <Alert
        type="info"
        showIcon
        message="密码修改成功后将退出当前登录状态，需要使用新密码重新登录。"
        style={{ marginBottom: 24 }}
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
    </div>
  )

  const phonePanel = (
    <div style={{ maxWidth: 520 }}>
      <Alert
        type={phoneBound ? 'success' : 'info'}
        showIcon
        message={
          phoneBound
            ? '当前手机号已完成验证。如需更换手机号，可输入新手机号并重新验证。'
            : '绑定手机号后，可用于后续身份验证和账号安全能力。'
        }
        style={{ marginBottom: 24 }}
      />
      <Form
        form={phoneForm}
        layout="vertical"
        autoComplete="off"
        initialValues={{ phone: user.phone || '' }}
      >
        <Form.Item
          label="手机号"
          name="phone"
          normalize={(value) =>
            typeof value === 'string' ? normalizeMainlandPhone(value) : value
          }
          rules={[
            { required: true, message: '请输入手机号' },
            {
              validator: (_, value) => {
                if (!value || isMainlandPhone(value)) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('请输入有效的中国大陆手机号'))
              },
            },
          ]}
        >
          <Input placeholder="支持 13800138000、+86 13800138000 等格式" />
        </Form.Item>
        <Form.Item
          label="验证码"
          name="code"
          rules={[
            { required: true, message: '请输入验证码' },
            { pattern: /^\d{6}$/, message: '验证码为 6 位数字' },
          ]}
        >
          <Input placeholder="请输入 6 位短信验证码" maxLength={6} />
        </Form.Item>
        <Space>
          <Button
            onClick={handleSendPhoneCode}
            loading={sendingCode}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `${countdown} 秒后重发` : '发送验证码'}
          </Button>
          <Button type="primary" loading={verifyingPhone} onClick={handleVerifyPhone}>
            确认绑定
          </Button>
        </Space>
      </Form>
    </div>
  )

  const securityTabItems = [
    {
      key: 'basic-info',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 6 }} />
          基本信息
        </span>
      ),
      children: basicInfoPanel,
    },
    {
      key: 'password-security',
      label: (
        <span>
          <SafetyOutlined style={{ marginRight: 6 }} />
          密码安全
        </span>
      ),
      children: passwordPanel,
    },
    {
      key: 'phone-binding',
      label: (
        <span>
          <MobileOutlined style={{ marginRight: 6 }} />
          手机号绑定
        </span>
      ),
      children: phonePanel,
    },
  ]

  const profileSecurityContent = (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {profileSummaryCard}
      <Card bodyStyle={{ paddingTop: 12 }}>
        <Tabs items={securityTabItems} />
      </Card>
    </Space>
  )

  const tabItems = [
    {
      key: 'profile-security',
      label: (
        <span>
          <SafetyOutlined style={{ marginRight: 6 }} />
          账号与安全
        </span>
      ),
      children: profileSecurityContent,
    },
    {
      key: 'family-bindings',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 6 }} />
          绑定管理
        </span>
      ),
      children: <FamilyBindingsPanel />,
    },
    {
      key: 'membership-orders',
      label: (
        <span>
          <MobileOutlined style={{ marginRight: 6 }} />
          会员与订单
        </span>
      ),
      children: <MembershipOrdersPanel />,
    },
  ]

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 4, fontSize: 24 }}>
        账户中心
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 14 }}>
        管理账号安全、家庭绑定、会员套餐和订单。
      </Typography.Text>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setSearchParams({ tab: key as AccountCenterTab })}
        items={tabItems}
        type="card"
        style={{ marginTop: 24 }}
      />
    </div>
  )
}
