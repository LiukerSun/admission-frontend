import { Spin } from 'antd'

export default function GlobalSpin() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }}
    >
      <Spin size="large" tip="加载中..." />
    </div>
  )
}
