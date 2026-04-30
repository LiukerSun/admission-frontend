import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

const { Content } = Layout

export default function AuthLayout() {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, rgba(247,245,239,0.96) 0%, rgba(238,245,246,0.98) 100%)',
      }}
    >
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ width: 'min(100%, 440px)' }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  )
}
