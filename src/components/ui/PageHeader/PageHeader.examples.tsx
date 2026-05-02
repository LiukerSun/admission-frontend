import { Button } from '../Button/Button'
import { PageHeader } from './PageHeader'

export function PageHeaderExamples() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <PageHeader
        actions={
          <>
            <Button variant="secondary">返回</Button>
            <Button>新增</Button>
          </>
        }
        subtitle="管理系统注册用户"
        title="用户管理"
      />
      <PageHeader bottomRadius="pill" tone="success" title="已保存" />
      <PageHeader collapseBreakpoint="sm" tone="warning" title="容器折叠示例" />
    </div>
  )
}
