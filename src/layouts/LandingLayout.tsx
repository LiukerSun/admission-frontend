import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
import { LANDING_NAV_ITEMS } from './components/landingNavItems'
import './landingLayout.css'

export default function LandingLayout() {
  const { isAuthenticated, logout, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isMarketingHome = location.pathname === '/'

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

  if (isMarketingHome) {
    return (
      <div className="landingRoot landingRootMarketing">
        <header className="marketingNav">
          <button className="marketingBrand" type="button" onClick={() => navigate('/')}>
            <span className="marketingBrandMark" />
            智慧高考
          </button>
          <nav className="marketingLinks" aria-label="首页导航">
            {LANDING_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="marketingActions">
            {isAuthenticated ? (
              <>
                <Button type="text" onClick={() => navigate('/dashboard')}>
                  控制台
                </Button>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                  <span className="marketingAvatar" title={user?.email || ''}>
                    <Avatar icon={<UserOutlined />} size="small" />
                  </span>
                </Dropdown>
              </>
            ) : (
              <>
                <Button type="text" onClick={() => navigate('/login')}>
                  登录
                </Button>
                <Button type="primary" onClick={() => navigate('/register')}>
                  注册
                </Button>
              </>
            )}
          </div>
        </header>
        <main className="marketingMain">
          <Outlet />
        </main>
      </div>
    )
  }

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
