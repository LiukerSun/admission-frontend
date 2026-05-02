import { Button, InputNumber, Select, message } from 'antd'
import { GlassPanel } from '@/components/ui'
import { CITY_OPTIONS, SUBJECT_OPTIONS, type SimulatorProfile } from '@/fixtures/simulator'
import ScoreProfileField from './ScoreProfileField'
import styles from './ScoreProfileCard.module.css'

export type ScoreProfileCardProps = {
  profile: SimulatorProfile
  onChange: (next: SimulatorProfile) => void
  onReset: () => void
  onOpenPreference: (key: 'weights' | 'cities' | 'majors') => void
}

export default function ScoreProfileCard({ profile, onChange, onReset, onOpenPreference }: ScoreProfileCardProps) {
  return (
    <GlassPanel padding="sm" className={styles.root}>
      <div className={styles.title}>我的成绩画像</div>

      <ScoreProfileField
        label="高考总分"
        control={
          <InputNumber
            value={profile.totalScore}
            onChange={(v) => onChange({ ...profile, totalScore: typeof v === 'number' ? v : undefined })}
            style={{ width: 86 }}
            controls={false}
            placeholder="—"
          />
        }
      />

      <div className={styles.grid2}>
        <ScoreProfileField
          label="全省排名"
          control={
            <InputNumber
              value={profile.provinceRank}
              onChange={(v) => onChange({ ...profile, provinceRank: typeof v === 'number' ? v : undefined })}
              style={{ width: 86 }}
              controls={false}
              placeholder="—"
            />
          }
        />
        <ScoreProfileField
          label="超越考生"
          control={
            <InputNumber
              value={profile.surpassPercent}
              onChange={(v) => onChange({ ...profile, surpassPercent: typeof v === 'number' ? v : undefined })}
              style={{ width: 76 }}
              controls={false}
              placeholder="—"
            />
          }
          suffix="%"
        />
      </div>

      <div className={styles.big}>
        <ScoreProfileField
          label="超出控制线"
          control={
            <InputNumber
              value={profile.safetyMargin}
              onChange={(v) => onChange({ ...profile, safetyMargin: typeof v === 'number' ? v : undefined })}
              style={{ width: 86 }}
              controls={false}
              placeholder="—"
            />
          }
        />
      </div>

      <div className={styles.footer}>
        <div className={styles.selectRow}>
          <Select
            value={profile.subject}
            onChange={(v) => onChange({ ...profile, subject: v })}
            style={{ width: 96 }}
            options={SUBJECT_OPTIONS}
          />
          <Select value={profile.city} onChange={(v) => onChange({ ...profile, city: v })} style={{ width: 96 }} options={CITY_OPTIONS} />
        </div>

        <Button
          className={styles.resetBtn}
          onClick={() => {
            onReset()
            message.success('已重置')
          }}
        >
          重新输入
        </Button>

        <button className={styles.prefBtn} type="button" onClick={() => onOpenPreference('weights')}>
          <span>报考偏好与权重</span>
          <span>›</span>
        </button>
        <button className={styles.prefBtn} type="button" onClick={() => onOpenPreference('cities')}>
          <span>意向城市</span>
          <span>›</span>
        </button>
        <button className={styles.prefBtn} type="button" onClick={() => onOpenPreference('majors')}>
          <span>意向专业</span>
          <span>›</span>
        </button>
      </div>
    </GlassPanel>
  )
}
