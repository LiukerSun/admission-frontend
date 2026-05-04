import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Breadcrumb, Button, Drawer, Dropdown, Grid, Layout, Menu, Spin } from 'antd'
import {
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  HomeOutlined,
  LinkOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { toAccountCenterPath } from '@/utils/accountCenter'
import type { MenuProps } from 'antd'

const { Header, Content } = Layout
const { useBreakpoint } = Grid

const ROUTE_TITLE_MAP: Record<string, string> = {
  '/dashboard': '控制台',
  '/analysis': '数据分析',
  '/profile': '账户中心',
  '/admin/dashboard': '统计看板',
  '/admin/users': '用户管理',
  '/admin/bindings': '绑定管理',
  '/admin/payment/orders': '支付订单',
}

function buildBreadcrumbItems(pathname: string) {
  const items: { title: string }[] = []

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
  const { user, isAdmin, logout, isRestoring } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isDesktop = Boolean(screens.lg)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const primaryMenuItems: MenuProps['items'] = [
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
  ]

  const adminMenuItems: MenuProps['items'] = [
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
    {
      key: '/admin/payment/orders',
      icon: <WalletOutlined />,
      label: <Link to="/admin/payment/orders">支付订单</Link>,
    },
  ]

  const accountMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '账户中心',
      onClick: () => navigate(toAccountCenterPath('profile-security')),
    },
    ...(isAdmin
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '系统管理',
            onClick: () => navigate('/admin/dashboard'),
          },
        ]
      : []),
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

  const breadcrumbItems = buildBreadcrumbItems(location.pathname)
  const isAdminRoute = location.pathname.startsWith('/admin')
  const currentMenuItems = isAdminRoute ? adminMenuItems : primaryMenuItems
  const selectedMenuKeys = [location.pathname]
  const userName = user?.email?.split('@')[0]

  const closeMobileMenu = () => setMobileMenuOpen(false)

  if (isRestoring) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: isDesktop ? '0 24px' : '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid #E9EEF6',
          position: 'sticky',
          top: 0,
          zIndex: 9,
          height: 'auto',
          minHeight: 64,
          lineHeight: 'normal',
        }}
      >
        {!isDesktop && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ width: 40, height: 40, flex: '0 0 auto' }}
            aria-label="打开导航菜单"
          />
        )}

        <div
          style={{
            fontSize: isDesktop ? 16 : 15,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#1E40AF',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
          onClick={() => navigate('/')}
          title="AI志愿填报助手"
        >
          AI志愿填报助手
        </div>

        {isDesktop && (
          <Menu
            mode="horizontal"
            selectedKeys={selectedMenuKeys}
            items={currentMenuItems}
            style={{ flex: 1, minWidth: 0, borderBottom: 0 }}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flex: '0 0 auto' }}>
          <Dropdown menu={{ items: notificationItems }} placement="bottomRight">
            <Badge count={2} size="small" offset={[0, 2]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18, color: '#64748B' }} />}
                style={{ width: 40, height: 40 }}
              />
            </Badge>
          </Dropdown>

          <Dropdown menu={{ items: accountMenuItems }} placement="bottomRight" trigger={['click']}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1E40AF' }} size="small" />
              {isDesktop && userName && (
                <span style={{ color: '#1E3A8A', fontWeight: 500, fontSize: 14 }}>
                  {userName}
                </span>
              )}
            </span>
          </Dropdown>
        </div>
      </Header>

      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #E9EEF6',
          padding: isDesktop ? '10px 24px' : '10px 16px',
        }}
      >
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
      </div>

      <Content style={{ margin: isDesktop ? 24 : 12, padding: 0 }}>
        <div style={{ padding: isDesktop ? 24 : 16, background: '#fff', borderRadius: 8, border: '1px solid #E9EEF6' }}>
          <Outlet />
        </div>
      </Content>

      <Drawer
        title="导航菜单"
        placement="left"
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        width={288}
      >
        <Menu
          mode="inline"
          selectedKeys={selectedMenuKeys}
          items={currentMenuItems}
          onClick={closeMobileMenu}
          style={{ borderRight: 0 }}
        />
      </Drawer>
    </Layout>
  )
}
