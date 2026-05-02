import { DeleteOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { IconButton } from './IconButton'

/**
 * IconButton examples
 *
 * Shows accessible icon-only controls with optional tooltips and inherited
 * Button states.
 */
export function IconButtonExamples() {
  return (
    <div>
      <IconButton aria-label="刷新" icon={<ReloadOutlined />} />
      <IconButton icon={<SettingOutlined />} tooltip="设置" />
      <IconButton aria-label="删除" disabled icon={<DeleteOutlined />} tone="danger" />
    </div>
  )
}
