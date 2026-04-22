import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, Spin } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  LinkOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

export default function BasicLayout() {
  const { user, logout, isRestoring } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">控制台</Link>,
    },
    {
      key: '/analysis',
      icon: <BarChartOutlined />,
      label: <Link to="/analysis">数据分析</Link>,
    },
    {
      key: '/bindings',
      icon: <LinkOutlined />,
      label: <Link to="/bindings">绑定管理</Link>,
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人中心</Link>,
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: '/admin',
            icon: <SettingOutlined />,
            label: '系统管理',
            children: [
              {
                key: '/admin/dashboard',
                icon: <BarChartOutlined />,
                label: <Link to="/admin/dashboard">统计看板</Link>,
              },
              {
                key: '/admin/users',
                icon: <TeamOutlined />,
                label: <Link to="/admin/users">用户管理</Link>,
              },
              {
                key: '/admin/bindings',
                icon: <LinkOutlined />,
                label: <Link to="/admin/bindings">绑定管理</Link>,
              },
            ],
          },
        ]
      : []),
  ]

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  if (isRestoring) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/')}>
          志愿报考
        </div>
        <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <span style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>{user?.email}</span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 4 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
