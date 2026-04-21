import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, List, Empty, message, Tag } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import { bindingsApi, type BindingWithUserDetail } from '@/services/bindings'
import { UserOutlined } from '@ant-design/icons'

export default function BindingsPage() {
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [bindings, setBindings] = useState<BindingWithUserDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isParent = user?.user_type === 'parent'

  const fetchBindings = async () => {
    setLoading(true)
    try {
      const res = await bindingsApi.list()
      setBindings(res.data.data?.bindings ?? [])
    } catch {
      message.error('获取绑定关系失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBindings()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const onFinish = async (values: { studentEmail: string }) => {
    setSubmitting(true)
    try {
      await bindingsApi.create({ student_email: values.studentEmail })
      message.success('绑定成功')
      form.resetFields()
      await fetchBindings()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr.response?.data?.message
      if (msg === 'student not found') {
        message.error('未找到该学生账号')
      } else if (msg === 'student already bound to another parent') {
        message.error('该学生已被其他家长绑定')
      } else if (msg === 'cannot bind yourself') {
        message.error('不能绑定自己')
      } else {
        message.error('绑定失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2>绑定管理</h2>

      {isParent && (
        <Card title="绑定学生" style={{ marginTop: 24, marginBottom: 24 }}>
          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item
              label="学生邮箱"
              name="studentEmail"
              rules={[
                { required: true, message: '请输入学生邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入学生的注册邮箱" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>
                发起绑定
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Card title={isParent ? '已绑定学生' : '已绑定家长'} loading={loading}>
        {bindings.length === 0 ? (
          <Empty description={isParent ? '尚未绑定任何学生' : '尚未绑定家长'} />
        ) : (
          <List
            dataSource={bindings}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<UserOutlined />}
                  title={item.user.email}
                  description={
                    <>
                      <Tag>{isParent ? '学生' : '家长'}</Tag>
                      <span style={{ marginLeft: 8, color: '#999' }}>
                        绑定时间：{new Date(item.created_at).toLocaleString()}
                      </span>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
