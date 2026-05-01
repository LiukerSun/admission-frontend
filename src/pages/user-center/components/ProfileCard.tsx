import { GlassPanel } from '@/components/ui'
import styles from './ProfileCard.module.css'

export type ProfileMeta = {
  parentBind?: string
  email?: string
  phone?: string
  region?: string
}

export type ProfileCardProps = {
  displayName: string
  meta: ProfileMeta
}

export default function ProfileCard({ displayName, meta }: ProfileCardProps) {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <div className={styles.avatar} />
      <div className={styles.main}>
        <div className={styles.hello}>你好，{displayName}</div>
        <div className={styles.meta}>
          <div>绑定信息-家长：{meta.parentBind || '-'}</div>
          <div>邮箱：{meta.email || '-'}</div>
          <div>手机号：{meta.phone || '-'}</div>
          <div>地区：{meta.region || '-'}</div>
        </div>
      </div>
    </GlassPanel>
  )
}

