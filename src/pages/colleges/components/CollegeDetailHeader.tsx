import { Button } from 'antd'
import { GlassPanel } from '@/components/ui'
import styles from './CollegeDetailHeader.module.css'

export type CollegeDetailHeaderProps = {
  name: string
  intro?: string
  inWishlist: boolean
  onToggleWishlist: () => void
}

export default function CollegeDetailHeader({ name, intro, inWishlist, onToggleWishlist }: CollegeDetailHeaderProps) {
  return (
    <GlassPanel variant="solid" padding="md" className={styles.root}>
      <div className={styles.left}>
        <div className={styles.logo} />
        <div className={styles.meta}>
          <div className={styles.name}>{name || '院校详情'}</div>
          <div className={styles.intro}>{intro || '介绍……介绍'}</div>
        </div>
      </div>
      <Button className={styles.action} onClick={onToggleWishlist}>
        {inWishlist ? '已加入填报清单' : '加入填报清单'}
      </Button>
    </GlassPanel>
  )
}

