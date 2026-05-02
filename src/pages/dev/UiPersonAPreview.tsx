import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Button, ButtonGroup, IconButton } from '@/components/ui'
import styles from './UiPersonAPreview.module.css'

function UiPersonAPreview() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Person A UI</p>
          <h1>原子控件预览</h1>
        </div>
        <ButtonGroup aria-label="Header actions" spacing="sm">
          <IconButton aria-label="刷新预览" icon={<ReloadOutlined />} tooltip="刷新预览" />
          <Button icon={<SaveOutlined />} radius="pill">
            保存
          </Button>
        </ButtonGroup>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>按钮样式</h2>
          <span>圆角、透明度、语义色</span>
        </div>
        <div className={styles.sampleGrid}>
          <Button radius="sm">主要按钮</Button>
          <Button radius="lg" variant="secondary">
            次要按钮
          </Button>
          <Button opacity={0.72} radius="xl" variant="ghost">
            透明按钮
          </Button>
          <Button radius="pill" variant="text">
            文本按钮
          </Button>
          <Button radius="pill" variant="link">
            链接按钮
          </Button>
          <Button radius="md" tone="danger">
            危险操作
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>图标按钮</h2>
          <span>带可访问标签的方形控件</span>
        </div>
        <ButtonGroup aria-label="Icon actions" spacing="md">
          <IconButton aria-label="编辑" icon={<EditOutlined />} tooltip="编辑" />
          <IconButton aria-label="确认" icon={<CheckOutlined />} tooltip="确认" />
          <IconButton aria-label="设置" icon={<SettingOutlined />} tooltip="设置" />
          <IconButton aria-label="删除" icon={<DeleteOutlined />} tone="danger" tooltip="删除" />
        </ButtonGroup>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>按钮组</h2>
          <span>横向与纵向间距</span>
        </div>
        <div className={styles.groupRows}>
          <ButtonGroup aria-label="Horizontal decision actions">
            <Button icon={<CheckOutlined />}>通过</Button>
            <Button variant="secondary">复核</Button>
            <Button tone="danger" variant="ghost">
              驳回
            </Button>
          </ButtonGroup>

          <ButtonGroup aria-label="Vertical profile actions" direction="vertical" spacing="lg">
            <Button radius="lg">继续</Button>
            <Button radius="lg" variant="secondary">
              保存草稿
            </Button>
            <Button radius="lg" variant="text">
              跳过
            </Button>
          </ButtonGroup>
        </div>
      </section>
    </main>
  )
}

export default UiPersonAPreview
