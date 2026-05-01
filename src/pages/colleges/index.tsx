import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Select, Tabs, message } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { getEnrollmentPlans } from '@/services/colleges'
import { GlassPanel, PageBoard } from '@/components/ui'
import {
  PROVINCE_OPTIONS,
  SAMPLE_PLANS,
  SCHOOL_LEVEL_OPTIONS,
  SCHOOL_TYPE_OPTIONS,
  type PlanExt,
} from '@/fixtures/colleges'
import CollegeDetailHeader from './components/CollegeDetailHeader'
import CollegeFilterBar from './components/CollegeFilterBar'
import MajorAdmissionList from './components/MajorAdmissionList'
import SchoolList from './components/SchoolList'
import styles from './colleges.module.css'

type PlaceholderCardProps = {
  title: string
  children?: React.ReactNode
  onClick?: () => void
}

function PlaceholderCard({ title, children, onClick }: PlaceholderCardProps) {
  return (
    <GlassPanel
      variant="solid"
      padding="none"
      className={[styles.placeholderCard, onClick ? styles.clickable : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <div className={styles.placeholderTitle}>{title}</div>
      {children}
    </GlassPanel>
  )
}

export default function CollegeLibraryPage() {
  const { isAuthenticated } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tabKey, setTabKey] = useState(() => searchParams.get('tab') || (searchParams.get('school') ? 'detail' : 'recommend'))
  const [loading, setLoading] = useState(false)
 
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') || '')
  const [province, setProvince] = useState<string | undefined>(undefined)
  const [schoolType, setSchoolType] = useState<string | undefined>(undefined)
  const [schoolLevel, setSchoolLevel] = useState<string | undefined>(undefined)
 
  const [sourcePlans, setSourcePlans] = useState<PlanExt[]>(SAMPLE_PLANS)
  const [plans, setPlans] = useState<PlanExt[]>(SAMPLE_PLANS)
  const [activeSchool, setActiveSchool] = useState<string | undefined>(() => searchParams.get('school') || SAMPLE_PLANS[0]?.school_name)
  const [compareSchools, setCompareSchools] = useState<string[]>([])
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const raw = localStorage.getItem('volunteer_wishlist_schools')
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as string[]
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
    } catch {
      return []
    }
  })
 
  const schools = useMemo(() => {
    const map = new Map<string, { name: string; province?: string }>()
    for (const p of plans) {
      const name = (p.school_name || '').trim()
      if (!name) continue
      if (!map.has(name)) map.set(name, { name, province: p.province })
    }
    return Array.from(map.values()).slice(0, 18)
  }, [plans])
 
  const activePlans = useMemo(() => {
    if (!activeSchool) return []
    return plans.filter((p) => (p.school_name || '').trim() === activeSchool)
  }, [activeSchool, plans])
 
  useEffect(() => {
    if (activeSchool || schools.length === 0) return
    const t = window.setTimeout(() => setActiveSchool(schools[0]?.name), 0)
    return () => window.clearTimeout(t)
  }, [activeSchool, schools])
 
  const applyFiltersLocal = useCallback((next?: { keyword?: string; province?: string; schoolType?: string; schoolLevel?: string }) => {
    const kw = (next?.keyword ?? keyword).trim()
    const pv = next?.province ?? province
    const st = next?.schoolType ?? schoolType
    const sl = next?.schoolLevel ?? schoolLevel
    const filtered = sourcePlans.filter((p) => {
      const name = (p.school_name || '').trim()
      if (kw && !name.includes(kw)) return false
      if (pv && p.province !== pv) return false
      if (st && p.school_type !== st) return false
      if (sl && p.school_level !== sl) return false
      return true
    })
    setPlans(filtered)
  }, [keyword, province, schoolType, schoolLevel, sourcePlans])
 
  const updateUrl = useCallback((next?: { tab?: string; school?: string; keyword?: string }) => {
    const params: Record<string, string> = {}
    const kw = (next?.keyword ?? keyword).trim()
    const tab = next?.tab ?? tabKey
    const school = next?.school ?? (tab === 'detail' ? activeSchool : undefined)
    if (kw) params.keyword = kw
    if (tab) params.tab = tab
    if (school) params.school = school
    setSearchParams(params, { replace: true })
  }, [activeSchool, keyword, setSearchParams, tabKey])

  const loadFromServer = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const list = await getEnrollmentPlans({
        school_name: keyword.trim() || undefined,
        province: province || undefined,
        page: 1,
        per_page: 60,
      })
      const typed = (list as PlanExt[]) || []
      setSourcePlans(typed.length > 0 ? typed : [])
      setPlans(typed.length > 0 ? typed : [])
      const first = typed.find((p) => (p.school_name || '').trim())?.school_name?.trim()
      if (first) setActiveSchool((prev) => prev || first)
    } catch {
      setSourcePlans([])
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const kw = searchParams.get('keyword') || ''
    const tab = searchParams.get('tab') || (searchParams.get('school') ? 'detail' : 'recommend')
    const school = searchParams.get('school') || ''
    const t = window.setTimeout(() => {
      if (kw !== keyword) setKeyword(kw)
      if (tab && tab !== tabKey) setTabKey(tab)
      if (school && school !== activeSchool) setActiveSchool(school)
      applyFiltersLocal({ keyword: kw })
    }, 0)
    return () => window.clearTimeout(t)
  }, [activeSchool, applyFiltersLocal, keyword, searchParams, tabKey])

  useEffect(() => {
    localStorage.setItem('volunteer_wishlist_schools', JSON.stringify(wishlist))
  }, [wishlist])

  const selectSchool = (name: string) => {
    setActiveSchool(name)
    setTabKey('detail')
    updateUrl({ tab: 'detail', school: name })
  }

  const inWishlist = Boolean(activeSchool && wishlist.includes(activeSchool))

  const compareStats = useMemo(() => {
    const stats: Array<{
      name: string
      province?: string
      plansCount: number
      majorsCount: number
      minScore?: number
      maxScore?: number
    }> = []
    for (const name of compareSchools) {
      const ps = sourcePlans.filter((p) => (p.school_name || '').trim() === name)
      const provinces = new Set(ps.map((p) => p.province).filter(Boolean) as string[])
      const majors = new Set(ps.map((p) => p.major_name).filter(Boolean) as string[])
      const mins = ps.map((p) => p.min_score).filter((v): v is number => typeof v === 'number')
      const maxs = ps.map((p) => p.max_score).filter((v): v is number => typeof v === 'number')
      stats.push({
        name,
        province: provinces.values().next().value,
        plansCount: ps.length,
        majorsCount: majors.size,
        minScore: mins.length ? Math.min(...mins) : undefined,
        maxScore: maxs.length ? Math.max(...maxs) : undefined,
      })
    }
    return stats
  }, [compareSchools, sourcePlans])
 
  return (
    <div className={styles.root}>
      <PageBoard>
        <div className={styles.inner}>
          <CollegeFilterBar
            keyword={keyword}
            province={province}
            schoolType={schoolType}
            schoolLevel={schoolLevel}
            provinceOptions={PROVINCE_OPTIONS}
            schoolTypeOptions={SCHOOL_TYPE_OPTIONS}
            schoolLevelOptions={SCHOOL_LEVEL_OPTIONS}
            canLoadFromServer={isAuthenticated}
            onKeywordChange={setKeyword}
            onProvinceChange={setProvince}
            onSchoolTypeChange={setSchoolType}
            onSchoolLevelChange={setSchoolLevel}
            onReset={() => {
              setKeyword('')
              setProvince(undefined)
              setSchoolType(undefined)
              setSchoolLevel(undefined)
              setCompareSchools([])
              setSourcePlans(SAMPLE_PLANS)
              setPlans(SAMPLE_PLANS)
              setActiveSchool(SAMPLE_PLANS[0]?.school_name)
              setSearchParams({}, { replace: true })
            }}
            onApply={() => {
              applyFiltersLocal()
              updateUrl({ keyword })
            }}
            onLoadFromServer={loadFromServer}
            onEnter={() => {
              applyFiltersLocal()
              updateUrl({ keyword })
            }}
          />

          <GlassPanel padding="none" className={styles.tabsWrap}>
            <Tabs
              activeKey={tabKey}
              onChange={(k) => {
                setTabKey(k)
                if (k === 'detail') {
                  const target = activeSchool || schools[0]?.name
                  if (target) {
                    setActiveSchool(target)
                    updateUrl({ tab: k, school: target })
                  } else {
                    updateUrl({ tab: k })
                  }
                } else {
                  updateUrl({ tab: k, school: '' })
                }
              }}
              items={[
                { key: 'recommend', label: '推荐院校列表' },
                { key: 'detail', label: '院校详情' },
                { key: 'trend', label: '分数趋势' },
                { key: 'compare', label: '院校对比' },
                { key: 'more', label: '...' },
              ]}
            />
          </GlassPanel>

          <div className={styles.contentGrid}>
            <SchoolList
              title="点击选择院校对比分析"
              loading={loading}
              schools={schools}
              activeSchool={activeSchool}
              compareSchools={compareSchools}
              onSelectSchool={selectSchool}
              onToggleCompare={(name) => {
                setCompareSchools((prev) => {
                  if (prev.includes(name)) return prev.filter((x) => x !== name)
                  if (prev.length >= 3) return prev
                  return [...prev, name]
                })
              }}
            />

            <GlassPanel padding="sm" className={styles.mainCards}>
              {tabKey === 'recommend' ? (
                <>
                  <div className={styles.recommendGridTop}>
                    <PlaceholderCard title="院校详情" onClick={() => setTabKey('detail')}>
                      <div className={styles.hintText}>{activeSchool ? `已选择：${activeSchool}` : '请选择一所院校'}</div>
                      <div className={styles.hintText} style={{ marginTop: 6 }}>
                        {activePlans.length ? `可用计划：${activePlans.length} 条` : '点击查看详情'}
                      </div>
                    </PlaceholderCard>
                    <PlaceholderCard title="分数趋势" onClick={() => setTabKey('trend')}>
                      <div className={styles.hintText}>趋势图（按年份/批次/省份）</div>
                    </PlaceholderCard>
                    <PlaceholderCard title="院校对比" onClick={() => setTabKey('compare')}>
                      <div className={styles.hintText}>已选：{compareSchools.length} / 3</div>
                    </PlaceholderCard>
                  </div>
                  <div className={styles.recommendGridBottom}>
                    <PlaceholderCard title="招生计划" onClick={() => setTabKey('detail')}>
                      <div className={styles.hintText}>
                        {activePlans.length
                          ? `热门专业：${activePlans.filter((p) => p.major_name).slice(0, 1).map((p) => p.major_name).join('') || '-'}`
                          : '展示热门专业/计划人数等'}
                      </div>
                    </PlaceholderCard>
                    <PlaceholderCard title="专业热度" onClick={() => setTabKey('detail')}>
                      <div className={styles.hintText}>展示热门专业与录取分数区间</div>
                    </PlaceholderCard>
                    <PlaceholderCard title="AI建议">
                      <div className={styles.hintText}>基于分数位次给出策略建议（预留接口）</div>
                    </PlaceholderCard>
                  </div>
                </>
              ) : null}

              {tabKey === 'detail' ? (
                <div className={styles.detailWrap}>
                  <CollegeDetailHeader
                    name={activeSchool || '院校详情'}
                    inWishlist={inWishlist}
                    onToggleWishlist={() => {
                      if (!activeSchool) return
                      setWishlist((prev) => {
                        const next = prev.includes(activeSchool) ? prev.filter((x) => x !== activeSchool) : [activeSchool, ...prev]
                        return next
                      })
                      message.success(activeSchool && !inWishlist ? '已加入填报清单' : '已从填报清单移除')
                    }}
                  />

                  <div className={styles.detailGrid}>
                    <GlassPanel variant="solid" padding="md">
                      <div className={styles.placeholderTitle}>历年投档分数线趋势</div>
                      <div className={styles.hintText}>预留：后续接入趋势接口后绘制折线图/区间图</div>
                    </GlassPanel>

                    <MajorAdmissionList title="优势专业录取详情" plans={activePlans} />

                    <GlassPanel variant="solid" padding="md">
                      <div className={styles.placeholderTitle}>就业去向及薪资</div>
                      <div className={styles.hintText}>预留：后续接入就业数据接口</div>
                    </GlassPanel>

                    <GlassPanel variant="solid" padding="md">
                      <div className={styles.placeholderTitle}>招生计划概览</div>
                      <div className={styles.hintText}>{activePlans.length ? `当前已加载计划：${activePlans.length} 条` : '暂无计划数据'}</div>
                    </GlassPanel>
                  </div>
                </div>
              ) : null}

              {tabKey === 'trend' ? (
                <GlassPanel variant="solid" padding="md" className={[styles.placeholderCard, styles.minH360].join(' ')}>
                  <div className={styles.placeholderTitle}>分数趋势</div>
                  <div className={styles.hintText}>后续接入接口后展示折线图/区间图</div>
                </GlassPanel>
              ) : null}

              {tabKey === 'compare' ? (
                <GlassPanel variant="solid" padding="md" className={[styles.placeholderCard, styles.minH360].join(' ')}>
                  <div className={styles.placeholderTitle}>院校对比</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Select
                      mode="multiple"
                      value={compareSchools}
                      onChange={(v) => setCompareSchools(v.slice(0, 3))}
                      style={{ minWidth: 320 }}
                      placeholder="选择 1~3 所院校"
                      options={schools.map((s) => ({ value: s.name, label: s.name }))}
                    />
                    <Button type="primary" disabled={compareSchools.length < 2} onClick={() => setTabKey('compare')}>
                      开始对比
                    </Button>
                  </div>
                  <div className={styles.hintText} style={{ marginTop: 14 }}>
                    {compareSchools.length === 0 ? '选择院校后，将展示层次、地区、热门专业与分数区间。' : `已选：${compareSchools.join('、')}`}
                  </div>
                  {compareSchools.length >= 2 ? (
                    <div className={styles.compareGrid}>
                      {compareStats.map((s) => (
                        <div key={s.name} className={styles.compareCard}>
                          <div className={styles.compareTitle}>{s.name}</div>
                          <div className={styles.compareMeta}>
                            <div>地区：{s.province || '-'}</div>
                            <div>计划条目：{s.plansCount}</div>
                            <div>专业覆盖：{s.majorsCount}</div>
                            <div>分数区间：{s.minScore ?? '-'} ~ {s.maxScore ?? '-'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </GlassPanel>
              ) : null}

              {tabKey === 'more' ? (
                <GlassPanel variant="solid" padding="md" className={[styles.placeholderCard, styles.minH360].join(' ')}>
                  <div className={styles.placeholderTitle}>更多能力</div>
                  <div className={styles.hintText}>可扩展：就业数据、专业画像、地区热力等</div>
                </GlassPanel>
              ) : null}
            </GlassPanel>
          </div>
        </div>
      </PageBoard>
    </div>
  )
}
