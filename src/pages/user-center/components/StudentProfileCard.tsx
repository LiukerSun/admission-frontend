import { Button, InputNumber, Select, message } from 'antd'
import { GlassPanel } from '@/components/ui'
import { SUBJECT_OPTIONS } from '@/fixtures/userCenter'
import styles from './StudentProfileCard.module.css'

export type StudentProfile = {
  subject?: string
  score?: number
  rank?: number
}

export type StudentProfileCardProps = {
  profile: StudentProfile
  onChange: (next: StudentProfile) => void
  onSave: () => void
}

export default function StudentProfileCard({ profile, onChange, onSave }: StudentProfileCardProps) {
  return (
    <GlassPanel padding="md" className={styles.root}>
      <div className={styles.title}>考生信息更新</div>
      <div className={styles.formGrid}>
        <Select
          allowClear
          placeholder="科目类别"
          value={profile.subject}
          onChange={(v) => onChange({ ...profile, subject: v })}
          options={SUBJECT_OPTIONS}
        />
        <InputNumber
          placeholder="估分/总分"
          value={profile.score}
          onChange={(v) => onChange({ ...profile, score: typeof v === 'number' ? v : undefined })}
          style={{ width: '100%' }}
        />
        <InputNumber
          placeholder="排名"
          value={profile.rank}
          onChange={(v) => onChange({ ...profile, rank: typeof v === 'number' ? v : undefined })}
          style={{ width: '100%' }}
        />
        <Button
          type="primary"
          onClick={() => {
            onSave()
            message.success('已保存')
          }}
        >
          保存
        </Button>
      </div>
    </GlassPanel>
  )
}

