import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Input } from 'antd'
import {
  BellOutlined,
  CalendarOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './landingLayout.css'

export default function LandingLayout() {
  const { isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    ['landingNavItem', isActive ? 'landingNavItemActive' : ''].filter(Boolean).join(' ')

  return (
    <div className="landingRoot">
      <div className="landingShell">
        <aside className="landingSider">
          <div className="landingBrand">
            <div className="landingBrandMark" />
            智慧高考
          </div>
          <nav className="landingNav">
            <NavLink to="/" end className={navItemClass}>
              首页
            </NavLink>
            <NavLink to="/analysis" className={navItemClass}>
              院校库
            </NavLink>
            <NavLink to="/dashboard" className={navItemClass}>
              数据中心
            </NavLink>
            <NavLink to="/bindings" className={navItemClass}>
              志愿模拟
            </NavLink>
            <NavLink to="/dashboard" className={navItemClass}>
              AI助手
            </NavLink>
          </nav>
          <div className="landingSideCard">
            <div className="landingSideCardHeader">
              <CalendarOutlined />
              报考月历
            </div>
            <div className="landingSideCardGlass" />
          </div>
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
                onPressEnter={() => navigate('/analysis')}
              />
            </div>
            <div className="landingActions">
              {isAuthenticated ? (
                <>
                  <Badge count={1} size="small">
                    <Button type="text" icon={<BellOutlined />} />
                  </Badge>
                  <Button type="text" icon={<UserOutlined />} onClick={() => navigate('/profile')} />
                  <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/dashboard')}>
                    控制台
                  </Button>
                  <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                    退出
                  </Button>
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
