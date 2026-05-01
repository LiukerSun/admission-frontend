import { Button, InputNumber, Select, message } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import './simulator.css'

type SimulatorProfile = {
  subject: string
  city: string
  totalScore?: number
  provinceRank?: number
  surpassPercent?: number
  safetyMargin?: number
}

const STORAGE_KEY = 'simulator_profile'

function loadProfile(): SimulatorProfile {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { subject: '理科', city: '哈尔滨' }
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
    return { subject: '理科', city: '哈尔滨' }
  }
}

function saveProfile(p: SimulatorProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
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
    <div className="simRoot">
      <div className="simBoard">
        <div className="simInner">
          <div className="simHeader">
            <div className="simHeaderLeft">
              <HomeOutlined />
              {title}
            </div>
            <div className="simHeaderRight">
              <span className="simHeaderBtn">
                <Button
                  onClick={() => message.info('预留：导出接口')}
                >
                  导出填报方案
                </Button>
              </span>
              <span className="simHeaderBtn">
                <Button
                  onClick={() => message.info('预留：分享接口')}
                >
                  分享给家长/学生
                </Button>
              </span>
            </div>
          </div>

          <div className="simMain">
            <div className="simGlassPanel scoreCard">
              <div className="scoreTitle">我的成绩画像</div>
              <div className="scorePill">
                <span className="scorePillLabel">高考总分</span>
                <span className="scorePillValue">
                  <InputNumber
                    value={profile.totalScore}
                    onChange={(v) => {
                      const next = { ...profile, totalScore: typeof v === 'number' ? v : undefined }
                      setProfile(next)
                      saveProfile(next)
                    }}
                    style={{ width: 86 }}
                    controls={false}
                    placeholder="—"
                  />
                </span>
              </div>

              <div className="scoreGrid2">
                <div className="scorePill">
                  <span className="scorePillLabel">全省排名</span>
                  <span className="scorePillValue">
                    <InputNumber
                      value={profile.provinceRank}
                      onChange={(v) => {
                        const next = { ...profile, provinceRank: typeof v === 'number' ? v : undefined }
                        setProfile(next)
                        saveProfile(next)
                      }}
                      style={{ width: 86 }}
                      controls={false}
                      placeholder="—"
                    />
                  </span>
                </div>
                <div className="scorePill">
                  <span className="scorePillLabel">超越考生</span>
                  <span className="scorePillValue">
                    <InputNumber
                      value={profile.surpassPercent}
                      onChange={(v) => {
                        const next = { ...profile, surpassPercent: typeof v === 'number' ? v : undefined }
                        setProfile(next)
                        saveProfile(next)
                      }}
                      style={{ width: 76 }}
                      controls={false}
                      placeholder="—"
                    />
                    <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: 12 }}>%</span>
                  </span>
                </div>
              </div>

              <div className="scoreBig">
                <span className="scorePillLabel">超出控制线</span>
                <span className="scorePillValue">
                  <InputNumber
                    value={profile.safetyMargin}
                    onChange={(v) => {
                      const next = { ...profile, safetyMargin: typeof v === 'number' ? v : undefined }
                      setProfile(next)
                      saveProfile(next)
                    }}
                    style={{ width: 86 }}
                    controls={false}
                    placeholder="—"
                  />
                </span>
              </div>

              <div className="scoreFooter">
                <div className="scoreSmallRow">
                  <Select
                    value={profile.subject}
                    onChange={(v) => {
                      const next = { ...profile, subject: v }
                      setProfile(next)
                      saveProfile(next)
                    }}
                    style={{ width: 96 }}
                    options={[
                      { value: '理科', label: '理科' },
                      { value: '文科', label: '文科' },
                      { value: '物理类', label: '物理类' },
                      { value: '历史类', label: '历史类' },
                    ]}
                  />
                  <Select
                    value={profile.city}
                    onChange={(v) => {
                      const next = { ...profile, city: v }
                      setProfile(next)
                      saveProfile(next)
                    }}
                    style={{ width: 96 }}
                    options={[
                      { value: '哈尔滨', label: '哈尔滨' },
                      { value: '北京', label: '北京' },
                      { value: '上海', label: '上海' },
                      { value: '广州', label: '广州' },
                      { value: '深圳', label: '深圳' },
                    ]}
                  />
                </div>
                <Button
                  className="scoreResetBtn"
                  onClick={() => {
                    const next: SimulatorProfile = { subject: '理科', city: '哈尔滨' }
                    setProfile(next)
                    saveProfile(next)
                    message.success('已重置')
                  }}
                >
                  重新输入
                </Button>

                <button className="prefBtn" type="button" onClick={() => message.info('预留：报考偏好与权重配置')}>
                  <span>报考偏好与权重</span>
                  <span>›</span>
                </button>
                <button className="prefBtn" type="button" onClick={() => message.info('预留：意向城市配置')}>
                  <span>意向城市</span>
                  <span>›</span>
                </button>
                <button className="prefBtn" type="button" onClick={() => message.info('预留：意向专业配置')}>
                  <span>意向专业</span>
                  <span>›</span>
                </button>
              </div>
            </div>

            <div className="simRightCol">
              <div className="topStats">
                <div>
                  <div className="statBlockTitle">冲一冲</div>
                  <div className="statBlockValue">
                    <div className="statNum">{counts.rush}</div>
                    <div className="statUnit">所院校</div>
                  </div>
                </div>
                <div>
                  <div className="statBlockTitle">稳一稳</div>
                  <div className="statBlockValue">
                    <div className="statNum">{counts.steady}</div>
                    <div className="statUnit">所院校</div>
                  </div>
                </div>
                <div>
                  <div className="statBlockTitle">保一保</div>
                  <div className="statBlockValue">
                    <div className="statNum">{counts.safe}</div>
                    <div className="statUnit">所院校</div>
                  </div>
                </div>
              </div>

              <div className="simGlassPanel recommendCard">
                <div className="recommendTitle">智能推荐院校（较稳方案）</div>
                <div className="recommendList">
                  <div className="recommendItem" />
                  <div className="recommendItem" />
                  <div className="recommendItem" />
                </div>
              </div>

              <div className="simBottomGrid">
                <div className="simGlassPanel simBottomCard">
                  <div className="simBottomTitle">AI建议</div>
                  <div className="simBottomPlaceholder" />
                </div>
                <div className="simGlassPanel simBottomCard">
                  <div className="simBottomTitle">方案状态</div>
                  <div className="simBottomPlaceholder" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
