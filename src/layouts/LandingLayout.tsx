import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Input } from 'antd'
import {
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  LinkOutlined,
  LoginOutlined,
  LogoutOutlined,
  SearchOutlined,
  SlidersOutlined,
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
            <img src="/landing/logo.webp" alt="智慧高考" className="landingBrandLogo" />
            <div>
              <span>智慧高考</span>
              <small>升学规划工作台</small>
            </div>
          </div>

          <nav className="landingNav">
            <NavLink to="/" end className={navItemClass}>
              <HomeOutlined />
              <span>首页</span>
            </NavLink>
            <NavLink to="/analysis" className={navItemClass}>
              <BarChartOutlined />
              <span>院校数据</span>
            </NavLink>
            <NavLink to="/dashboard" className={navItemClass}>
              <SlidersOutlined />
              <span>数据中心</span>
            </NavLink>
            <NavLink to="/bindings" className={navItemClass}>
              <LinkOutlined />
              <span>协作填报</span>
            </NavLink>
          </nav>

          <div className="landingSideCard">
            <div className="landingSideCardHeader">
              <CalendarOutlined />
              报考节奏
            </div>
            <div className="landingSideCardSteps">
              <div className="landingTimelineItem">
                <CheckCircleOutlined />
                查分与位次确认
              </div>
              <div className="landingTimelineItem">
                <CheckCircleOutlined />
                院校专业短名单
              </div>
              <div className="landingTimelineItem">
                <CheckCircleOutlined />
                家庭协作核对
              </div>
              <div className="landingTimelineItem">
                <CheckCircleOutlined />
                志愿方案导出
              </div>
              <div className="landingTimelineItem">
                <CheckCircleOutlined />
                录取进度跟踪
              </div>
            </div>
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
                placeholder="搜索院校、专业或功能"
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
