import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button } from 'antd'
import { useAuthStore } from '@/stores/authStore'

const { Header, Content, Footer } = Layout

export default function LandingLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = isAuthenticated
    ? [
        { key: 'dashboard', label: <Link to="/dashboard">控制台</Link> },
        { key: 'profile', label: <Link to="/profile">个人中心</Link> },
        { key: 'logout', label: <Button type="link" onClick={handleLogout}>退出</Button> },
      ]
    : [
        { key: 'login', label: <Link to="/login">登录</Link> },
        { key: 'register', label: <Link to="/register">注册</Link> },
      ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>志愿报考分析平台</div>
        <Menu mode="horizontal" items={menuItems} style={{ flex: 1, justifyContent: 'flex-end', border: 'none' }} />
      </Header>
      <Content>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        志愿报考分析平台 ©2024
      </Footer>
    </Layout>
  )
}
