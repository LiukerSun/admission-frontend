import { Outlet, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Dropdown, Input } from 'antd'
import {
  BellOutlined,
  HomeOutlined,
  LoginOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import type { MenuProps } from 'antd'
import LandingSiderNav from './components/LandingSiderNav'
import './landingLayout.css'

export default function LandingLayout() {
  const { isAuthenticated, logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-center',
      label: '用户中心',
      onClick: () => navigate('/user-center'),
    },
    {
      key: 'logout',
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <div className="landingRoot">
      <div className="landingShell">
        <aside className="landingSider">
          <LandingSiderNav />
        </aside>

        <div className="landingMain">
          <div className="landingTopbar">
            <div className="landingTopbarLeft">
              <Button type="text" icon={<HomeOutlined />} onClick={() => navigate('/')} />
            </div>
            <div className="landingSearch">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="全局搜素"
                onPressEnter={(e) => {
                  const val = (e.target as HTMLInputElement).value
                  const q = val.trim()
                  navigate(q ? `/colleges?keyword=${encodeURIComponent(q)}` : '/colleges')
                }}
              />
            </div>
            <div className="landingActions">
              {isAuthenticated ? (
                <>
                  <Badge count={1} size="small">
                    <Button type="text" icon={<BellOutlined />} />
                  </Badge>
                  <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/dashboard')}>
                    控制台
                  </Button>
                  <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }} title={user?.email || ''}>
                      <Avatar icon={<UserOutlined />} />
                    </span>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
                    登录
                  </Button>
                  <Button type="primary" onClick={() => navigate('/register')}>
                    注册
                  </Button>
                  <Avatar icon={<UserOutlined />} />
                </>
              )}
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
