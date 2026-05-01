import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { PageBoard } from '@/components/ui'
import { STUDENT_PROFILE_STORAGE_KEY, WISHLIST_MAX_COUNT, WISHLIST_STORAGE_KEY } from '@/fixtures/userCenter'
import AccountManageCard from './components/AccountManageCard'
import ExportRecordCard from './components/ExportRecordCard'
import ProfileCard from './components/ProfileCard'
import ScoreChartCard from './components/ScoreChartCard'
import StudentProfileCard, { type StudentProfile } from './components/StudentProfileCard'
import WishlistCard from './components/WishlistCard'
import styles from './userCenter.module.css'

function loadStudentProfile(): StudentProfile {
  const raw = localStorage.getItem(STUDENT_PROFILE_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as StudentProfile
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadWishlist(): string[] {
  const raw = localStorage.getItem(WISHLIST_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.slice(0, WISHLIST_MAX_COUNT) : []
  } catch {
    return []
  }
}

export default function UserCenterPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const displayName = useMemo(() => {
    const base = user?.email?.split('@')[0] || '用户'
    const prefix = user?.user_type === 'student' ? '学生' : '家长'
    return `${prefix}${base}`
  }, [user?.email, user?.user_type])

  const [profile, setProfile] = useState<StudentProfile>(() => loadStudentProfile())
  const [wishlist] = useState<string[]>(() => loadWishlist())

  return (
    <div className={styles.root}>
      <PageBoard>
        <div className={styles.inner}>
          <div className={styles.topRow}>
            <ProfileCard
              displayName={displayName}
              meta={{
                parentBind: user?.user_type === 'student' ? '002' : '-',
                email: user?.email || '-',
                phone: '-',
                region: '黑龙江 哈尔滨',
              }}
            />
            <AccountManageCard
              onGoMembership={() => navigate('/membership')}
              onGoBindings={() => navigate('/bindings-manage')}
              onLogout={() => {
                logout()
                navigate('/login')
              }}
              onSwitchAccount={() => navigate('/login')}
            />
          </div>

          <div className={styles.midRow}>
            <StudentProfileCard
              profile={profile}
              onChange={setProfile}
              onSave={() => localStorage.setItem(STUDENT_PROFILE_STORAGE_KEY, JSON.stringify(profile))}
            />
            <ScoreChartCard />
          </div>

          <div className={styles.bottomRow}>
            <WishlistCard
              items={wishlist}
              onView={(schoolName) =>
                navigate(`/colleges?tab=detail&school=${encodeURIComponent(schoolName)}`)
              }
            />
            <ExportRecordCard />
          </div>
        </div>
      </PageBoard>
    </div>
  )
}
