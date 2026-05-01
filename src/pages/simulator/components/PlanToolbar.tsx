import { Button, message } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { GlassPanel } from '@/components/ui'
import styles from './PlanToolbar.module.css'

export type PlanToolbarProps = {
  title: string
}

export default function PlanToolbar({ title }: PlanToolbarProps) {
  return (
    <GlassPanel padding="sm" className={styles.root}>
      <div className={styles.left}>
        <HomeOutlined />
        {title}
      </div>
      <div className={styles.right}>
        <span className={styles.btnWrap}>
          <Button onClick={() => message.info('预留：导出接口')}>导出填报方案</Button>
        </span>
        <span className={styles.btnWrap}>
          <Button onClick={() => message.info('预留：分享接口')}>分享给家长/学生</Button>
        </span>
      </div>
    </GlassPanel>
  )
}

