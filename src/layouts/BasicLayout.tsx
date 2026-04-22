import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, Spin, Breadcrumb, Button, Badge, Input } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  LinkOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SearchOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

const ROUTE_TITLE_MAP: Record<string, string> = {
  '/dashboard': '控制台',
  '/analysis': '数据分析',
  '/bindings': '绑定管理',
  '/profile': '个人中心',
  '/admin/dashboard': '统计看板',
  '/admin/users': '用户管理',
  '/admin/bindings': '绑定管理',
}

function buildBreadcrumbItems(pathname: string) {
  const items: { title: string; path?: string }[] = []

  if (pathname.startsWith('/admin')) {
    items.push({ title: '系统管理' })
    const sub = ROUTE_TITLE_MAP[pathname]
    if (sub) items.push({ title: sub })
  } else {
    const title = ROUTE_TITLE_MAP[pathname]
    if (title) items.push({ title })
  }

  return items
}

export default function BasicLayout() {
  const { user, logout, isRestoring } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

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

  const notificationItems: MenuProps['items'] = [
    { key: '1', label: '系统通知：数据分析模块已更新', disabled: true },
    { key: '2', label: '志愿模拟功能上线', disabled: true },
    { type: 'divider' as const },
    { key: 'all', label: '查看全部通知', onClick: () => navigate('/dashboard') },
  ]

  const quickNavItems: MenuProps['items'] = [
    { key: 'dashboard', icon: <HomeOutlined />, label: '控制台', onClick: () => navigate('/dashboard') },
    { key: 'analysis', icon: <BarChartOutlined />, label: '数据分析', onClick: () => navigate('/analysis') },
    { key: 'bindings', icon: <LinkOutlined />, label: '绑定管理', onClick: () => navigate('/bindings') },
    { type: 'divider' as const },
    { key: 'help', icon: <QuestionCircleOutlined />, label: '使用帮助', onClick: () => navigate('/dashboard') },
    { key: 'feedback', icon: <FileTextOutlined />, label: '意见反馈', onClick: () => navigate('/profile') },
  ]

  const breadcrumbItems = buildBreadcrumbItems(location.pathname)

  if (isRestoring) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            fontSize: collapsed ? 20 : 16,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#1E40AF',
            borderBottom: '1px solid #E9EEF6',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
          onClick={() => navigate('/')}
          title="AI志愿填报助手"
        >
          {collapsed ? (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>AI</span>
          ) : 'AI志愿填报助手'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={location.pathname.startsWith('/admin') ? ['/admin'] : []}
          items={menuItems}
          style={{ borderRight: 0 }}
          inlineCollapsed={collapsed}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E9EEF6',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          {/* 左侧：折叠按钮 + 面包屑 + 快捷入口 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />

            {breadcrumbItems.length > 0 && (
              <Breadcrumb
                items={[
                  { title: <Link to="/dashboard" style={{ color: '#64748B' }}><HomeOutlined /></Link> },
                  ...breadcrumbItems.map((item, idx) => ({
                    title: (
                      <span style={{
                        color: idx === breadcrumbItems.length - 1 ? '#1E3A8A' : '#64748B',
                        fontWeight: idx === breadcrumbItems.length - 1 ? 600 : 400,
                      }}>
                        {item.title}
                      </span>
                    ),
                  })),
                ]}
              />
            )}

            <Dropdown menu={{ items: quickNavItems }} placement="bottomLeft">
              <Button type="link" style={{ color: '#64748B', padding: '0 8px' }}>
                快捷入口 ▾
              </Button>
            </Dropdown>
          </div>

          {/* 右侧：搜索 + 通知 + 用户 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              placeholder="全局搜索..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              style={{ width: 200, borderRadius: 20, background: '#F1F5F9', borderColor: 'transparent' }}
              onPressEnter={(e) => {
                const val = (e.target as HTMLInputElement).value
                if (val.trim()) {
                  navigate('/analysis')
                }
              }}
            />

            <Dropdown menu={{ items: notificationItems }} placement="bottomRight">
              <Badge count={2} size="small" offset={[0, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#64748B' }} />}
                  style={{ width: 40, height: 40 }}
                />
              </Badge>
            </Dropdown>

            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1E40AF' }} size="small" />
                {!collapsed && (
                  <span style={{ color: '#1E3A8A', fontWeight: 500, fontSize: 14 }}>
                    {user?.email?.split('@')[0]}
                  </span>
                )}
              </span>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 24, padding: 0 }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8, border: '1px solid #E9EEF6' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
