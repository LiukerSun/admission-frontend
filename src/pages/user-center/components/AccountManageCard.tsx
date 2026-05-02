import { GlassPanel, SectionHeader } from '@/components/ui'
import { ActionListItem } from '@/components/ui'
import styles from './AccountManageCard.module.css'

export type AccountManageCardProps = {
  onGoMembership: () => void
  onGoBindings: () => void
  onLogout: () => void
  onSwitchAccount: () => void
}

export default function AccountManageCard({ onGoMembership, onGoBindings, onLogout, onSwitchAccount }: AccountManageCardProps) {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <SectionHeader title="账号管理" size="md" className={styles.header} />
      <div className={styles.list}>
        <ActionListItem title="会员中心" right="›" onClick={onGoMembership} />
        <ActionListItem title="绑定信息" right="›" onClick={onGoBindings} />
        <ActionListItem title="退出登录" right="›" onClick={onLogout} />
        <ActionListItem title="切换账号" right="›" onClick={onSwitchAccount} />
      </div>
    </GlassPanel>
  )
}

