import { Button, InputNumber, Select, message } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import './userCenter.css'

type StudentProfile = {
  subject?: string
  score?: number
  rank?: number
}

function loadStudentProfile(): StudentProfile {
  const raw = localStorage.getItem('student_profile')
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as StudentProfile
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadWishlist(): string[] {
  const raw = localStorage.getItem('volunteer_wishlist_schools')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.slice(0, 6) : []
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
    <div className="userCenterRoot">
      <div className="userCenterBoard">
        <div className="userCenterInner">
          <div className="topRow">
            <div className="glassPanel profileCard">
              <div className="profileAvatar" />
              <div style={{ minWidth: 0 }}>
                <div className="profileHello">你好，{displayName}</div>
                <div className="profileMeta">
                  <div>绑定信息-家长：{user?.user_type === 'student' ? '002' : '-'}</div>
                  <div>邮箱：{user?.email || '-'}</div>
                  <div>手机号：-</div>
                  <div>地区：黑龙江 哈尔滨</div>
                </div>
              </div>
            </div>

            <div className="glassPanel manageCard">
              <div className="manageTitle">账号管理</div>
              <div className="manageList">
                <button className="manageItem" type="button" onClick={() => navigate('/membership')}>
                  <span>会员中心</span>
                  <span>›</span>
                </button>
                <button className="manageItem" type="button" onClick={() => navigate('/bindings-manage')}>
                  <span>绑定信息</span>
                  <span>›</span>
                </button>
                <button
                  className="manageItem"
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                >
                  <span>退出登录</span>
                  <span>›</span>
                </button>
                <button className="manageItem" type="button" onClick={() => navigate('/login')}>
                  <span>切换账号</span>
                  <span>›</span>
                </button>
              </div>
            </div>
          </div>

          <div className="midRow">
            <div className="glassPanel cardPad">
              <div className="cardTitleRed">考生信息更新</div>
              <div className="formGrid">
                <Select
                  allowClear
                  placeholder="科目类别"
                  value={profile.subject}
                  onChange={(v) => setProfile((p) => ({ ...p, subject: v }))}
                  options={[
                    { value: '物理类', label: '物理类' },
                    { value: '历史类', label: '历史类' },
                    { value: '理科', label: '理科' },
                    { value: '文科', label: '文科' },
                  ]}
                />
                <InputNumber
                  placeholder="估分/总分"
                  value={profile.score}
                  onChange={(v) => setProfile((p) => ({ ...p, score: typeof v === 'number' ? v : undefined }))}
                  style={{ width: '100%' }}
                />
                <InputNumber
                  placeholder="排名"
                  value={profile.rank}
                  onChange={(v) => setProfile((p) => ({ ...p, rank: typeof v === 'number' ? v : undefined }))}
                  style={{ width: '100%' }}
                />
                <Button
                  type="primary"
                  onClick={() => {
                    localStorage.setItem('student_profile', JSON.stringify(profile))
                    message.success('已保存')
                  }}
                >
                  保存
                </Button>
              </div>
            </div>

            <div className="glassPanel cardPad">
              <div className="cardTitleGreen">分数定位图</div>
              <div className="scoreBox">
                <div style={{ height: 84 }} />
                <div className="scorePlaceholder" />
              </div>
            </div>
          </div>

          <div className="bottomRow">
            <div className="glassPanel cardPad">
              <div className="cardTitleOrange">收藏院校</div>
              <div className="miniList">
                {wishlist.length === 0 ? (
                  <div className="miniPill">
                    <span>暂无收藏</span>
                    <span />
                  </div>
                ) : (
                  wishlist.map((s) => (
                    <div key={s} className="miniPill">
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
                      <Button type="link" size="small" onClick={() => navigate(`/colleges?tab=detail&school=${encodeURIComponent(s)}`)}>
                        查看
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glassPanel cardPad">
              <div className="cardTitleBlue">管理导出记录</div>
              <div style={{ height: 130 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
