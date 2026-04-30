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
  CrownOutlined,
  ShoppingOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import type { MenuProps } from 'antd'
import './basicLayout.css'

const { Header, Sider, Content } = Layout

const ROUTE_TITLE_MAP: Record<string, string> = {
  '/dashboard': '控制台',
  '/analysis': '数据分析',
  '/membership': '会员中心',
  '/orders': '我的订单',
  '/bindings': '绑定管理',
  '/profile': '个人中心',
  '/admin/dashboard': '统计看板',
  '/admin/users': '用户管理',
  '/admin/bindings': '绑定管理',
  '/admin/payment/orders': '支付订单',
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
      key: '/membership',
      icon: <CrownOutlined />,
      label: <Link to="/membership">会员中心</Link>,
    },
    {
      key: '/orders',
      icon: <ShoppingOutlined />,
      label: <Link to="/orders">我的订单</Link>,
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
              {
                key: '/admin/payment/orders',
                icon: <WalletOutlined />,
                label: <Link to="/admin/payment/orders">支付订单</Link>,
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
    { key: 'membership', icon: <CrownOutlined />, label: '会员中心', onClick: () => navigate('/membership') },
    { key: 'orders', icon: <ShoppingOutlined />, label: '我的订单', onClick: () => navigate('/orders') },
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
    <Layout className="appShell">
      <Sider
        theme="light"
        width={236}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        className="appSider"
      >
        <div
          className={collapsed ? 'appBrand appBrandCollapsed' : 'appBrand'}
          onClick={() => navigate('/')}
          title="AI志愿填报助手"
        >
          <span className="appBrandMark">AI</span>
          {!collapsed && <span>志愿填报助手</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={location.pathname.startsWith('/admin') ? ['/admin'] : []}
          items={menuItems}
          className="appMenu"
          inlineCollapsed={collapsed}
        />
      </Sider>

      <Layout>
        <Header className="appHeader">
          {/* 左侧：折叠按钮 + 面包屑 + 快捷入口 */}
          <div className="appHeaderLeft">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />

            {breadcrumbItems.length > 0 && (
              <Breadcrumb
                className="appBreadcrumb"
                items={[
                  { title: <Link to="/dashboard" style={{ color: 'var(--color-text-muted)' }}><HomeOutlined /></Link> },
                  ...breadcrumbItems.map((item, idx) => ({
                    title: (
                      <span style={{
                        color: idx === breadcrumbItems.length - 1 ? 'var(--color-text)' : 'var(--color-text-muted)',
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
              <Button type="link" className="appQuickLink">
                快捷入口 ▾
              </Button>
            </Dropdown>
          </div>

          {/* 右侧：搜索 + 通知 + 用户 */}
          <div className="appHeaderRight">
            <Input
              placeholder="搜索功能或数据..."
              prefix={<SearchOutlined style={{ color: 'var(--color-text-subtle)' }} />}
              className="appSearch"
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
                  icon={<BellOutlined style={{ fontSize: 18, color: 'var(--color-text-muted)' }} />}
                  style={{ width: 40, height: 40 }}
                />
              </Badge>
            </Dropdown>

            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
              <span className="appUserTrigger">
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: 'var(--color-primary)' }} size="small" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {user?.email?.split('@')[0]}
                </span>
              </span>
            </Dropdown>
          </div>
        </Header>

        <Content className="appContent">
          <div className="appContentInner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
