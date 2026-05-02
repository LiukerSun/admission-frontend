import { Input } from 'antd'
import { FormField } from './FormField'

export function FormFieldExamples() {
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
      <FormField htmlFor="name" label="姓名" required>
        <Input id="name" placeholder="请输入姓名" />
      </FormField>
      <FormField helpText="仅用于通知" htmlFor="email" label="邮箱">
        <Input id="email" placeholder="请输入邮箱" />
      </FormField>
      <FormField error="必填项" htmlFor="phone" label="手机号">
        <Input id="phone" placeholder="请输入手机号" />
      </FormField>
      <FormField hiddenLabel htmlFor="search" label="搜索">
        <Input id="search" placeholder="视觉隐藏 label 的输入框" />
      </FormField>
      <FormField htmlFor="horizontal" label="横向布局" layout="horizontal">
        <Input id="horizontal" placeholder="输入内容" />
      </FormField>
    </div>
  )
}
