import { Outlet, Link } from 'react-router-dom'
import { Layout, Menu, Button } from 'antd'
import { useAuthStore } from '@/stores/authStore'

const { Header, Content, Footer } = Layout

export default function LandingLayout() {
  const { isAuthenticated, logout } = useAuthStore()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>志愿报考分析平台</div>
        <Menu mode="horizontal" style={{ flex: 1, justifyContent: 'flex-end', border: 'none' }}>
          {isAuthenticated ? (
            <>
              <Menu.Item key="dashboard">
                <Link to="/dashboard">控制台</Link>
              </Menu.Item>
              <Menu.Item key="profile">
                <Link to="/profile">个人中心</Link>
              </Menu.Item>
              <Menu.Item key="logout">
                <Button type="link" onClick={logout}>退出</Button>
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item key="login">
                <Link to="/login">登录</Link>
              </Menu.Item>
              <Menu.Item key="register">
                <Link to="/register">注册</Link>
              </Menu.Item>
            </>
          )}
        </Menu>
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
