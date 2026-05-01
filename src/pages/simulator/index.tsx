import { useMemo, useState } from 'react'
import { message } from 'antd'
import { PageBoard } from '@/components/ui'
import { DEFAULT_SIMULATOR_PROFILE, SIMULATOR_STORAGE_KEY, type SimulatorProfile } from '@/fixtures/simulator'
import BottomCards from './components/BottomCards'
import PlanToolbar from './components/PlanToolbar'
import RecommendationList from './components/RecommendationList'
import RiskStatGroup from './components/RiskStatGroup'
import ScoreProfileCard from './components/ScoreProfileCard'
import styles from './simulator.module.css'

function loadProfile(): SimulatorProfile {
  const raw = localStorage.getItem(SIMULATOR_STORAGE_KEY)
  if (!raw) return DEFAULT_SIMULATOR_PROFILE
  try {
    const parsed = JSON.parse(raw) as Partial<SimulatorProfile>
    return {
      subject: typeof parsed.subject === 'string' ? parsed.subject : '理科',
      city: typeof parsed.city === 'string' ? parsed.city : '哈尔滨',
      totalScore: typeof parsed.totalScore === 'number' ? parsed.totalScore : undefined,
      provinceRank: typeof parsed.provinceRank === 'number' ? parsed.provinceRank : undefined,
      surpassPercent: typeof parsed.surpassPercent === 'number' ? parsed.surpassPercent : undefined,
      safetyMargin: typeof parsed.safetyMargin === 'number' ? parsed.safetyMargin : undefined,
    }
  } catch {
    return DEFAULT_SIMULATOR_PROFILE
  }
}

function saveProfile(p: SimulatorProfile) {
  localStorage.setItem(SIMULATOR_STORAGE_KEY, JSON.stringify(p))
}

export default function VolunteerSimulatorPage() {
  const [profile, setProfile] = useState<SimulatorProfile>(() => loadProfile())

  const title = useMemo(() => {
    const city = profile.city || '哈尔滨'
    const subject = profile.subject || '理科'
    return `${city}${subject}稳妥方案`
  }, [profile.city, profile.subject])

  const counts = useMemo(() => {
    const base = profile.provinceRank ? Math.max(1, Math.min(100, Math.round(profile.provinceRank / 1000))) : 12
    return { rush: Math.max(8, Math.min(18, Math.round(14 - base / 10))), steady: 28, safe: 45 }
  }, [profile.provinceRank])

  return (
    <div className={styles.root}>
      <PageBoard>
        <div className={styles.inner}>
          <PlanToolbar title={title} />
          <div className={styles.main}>
            <ScoreProfileCard
              profile={profile}
              onChange={(next) => {
                setProfile(next)
                saveProfile(next)
              }}
              onReset={() => {
                setProfile(DEFAULT_SIMULATOR_PROFILE)
                saveProfile(DEFAULT_SIMULATOR_PROFILE)
              }}
              onOpenPreference={(key) => {
                if (key === 'weights') return message.info('预留：报考偏好与权重配置')
                if (key === 'cities') return message.info('预留：意向城市配置')
                return message.info('预留：意向专业配置')
              }}
            />

            <div className={styles.rightCol}>
              <RiskStatGroup counts={counts} />
              <RecommendationList />
              <BottomCards />
            </div>
          </div>
        </div>
      </PageBoard>
    </div>
  )
}
