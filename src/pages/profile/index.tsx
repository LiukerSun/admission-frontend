import { Card, Descriptions } from 'antd'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <h2>个人中心</h2>
      <Card style={{ marginTop: 24 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="用户 ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="角色">{user.role === 'admin' ? '管理员' : '普通用户'}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{new Date(user.created_at).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
