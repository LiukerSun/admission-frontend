import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Empty, Input, Select, Spin, Tabs, message } from 'antd'
import { CheckOutlined, FilterOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { getEnrollmentPlans, type EnrollmentPlan } from '@/services/colleges'
import './colleges.css'
 
type PlanExt = EnrollmentPlan & {
  school_type?: string
  school_level?: string
}
 
const SAMPLE_PLANS: PlanExt[] = [
  { school_name: '清华大学', province: '北京', year: 2025, batch: '本科一批', major_name: '计算机科学与技术', min_score: 690, max_score: 705, plan_count: 12, school_type: '理工', school_level: '985' },
  { school_name: '北京大学', province: '北京', year: 2025, batch: '本科一批', major_name: '经济学', min_score: 685, max_score: 702, plan_count: 10, school_type: '综合', school_level: '985' },
  { school_name: '复旦大学', province: '上海', year: 2025, batch: '本科一批', major_name: '临床医学', min_score: 670, max_score: 690, plan_count: 18, school_type: '综合', school_level: '985' },
  { school_name: '浙江大学', province: '浙江', year: 2025, batch: '本科一批', major_name: '软件工程', min_score: 665, max_score: 688, plan_count: 16, school_type: '理工', school_level: '985' },
  { school_name: '南京大学', province: '江苏', year: 2025, batch: '本科一批', major_name: '数学与应用数学', min_score: 660, max_score: 684, plan_count: 14, school_type: '综合', school_level: '985' },
  { school_name: '中山大学', province: '广东', year: 2025, batch: '本科一批', major_name: '法学', min_score: 645, max_score: 672, plan_count: 22, school_type: '综合', school_level: '211' },
  { school_name: '武汉大学', province: '湖北', year: 2025, batch: '本科一批', major_name: '新闻传播学', min_score: 640, max_score: 668, plan_count: 20, school_type: '综合', school_level: '211' },
  { school_name: '四川大学', province: '四川', year: 2025, batch: '本科一批', major_name: '口腔医学', min_score: 638, max_score: 666, plan_count: 12, school_type: '综合', school_level: '211' },
]
 
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
    <div className="collegePageRoot">
      <div className="collegeBoard">
        <div className="collegeBoardInner">
          <div className="glassPanel filterBar">
            <div className="filterLabel">
              <FilterOutlined />
              筛选
            </div>
            <div className="filterFields">
              <Input
                allowClear
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="搜索院校名称"
                onPressEnter={() => {
                  applyFiltersLocal()
                  updateUrl({ keyword })
                }}
              />
              <Select
                allowClear
                value={province}
                onChange={(v) => setProvince(v)}
                placeholder="所在地区"
                options={[
                  { value: '北京', label: '北京' },
                  { value: '上海', label: '上海' },
                  { value: '广东', label: '广东' },
                  { value: '江苏', label: '江苏' },
                  { value: '浙江', label: '浙江' },
                  { value: '山东', label: '山东' },
                  { value: '湖北', label: '湖北' },
                  { value: '四川', label: '四川' },
                ]}
              />
              <Select
                allowClear
                value={schoolType}
                onChange={(v) => setSchoolType(v)}
                placeholder="院校类别"
                options={[
                  { value: '综合', label: '综合' },
                  { value: '理工', label: '理工' },
                  { value: '师范', label: '师范' },
                  { value: '财经', label: '财经' },
                  { value: '医药', label: '医药' },
                ]}
              />
              <Select
                allowClear
                value={schoolLevel}
                onChange={(v) => setSchoolLevel(v)}
                placeholder="院校层次"
                options={[
                  { value: '985', label: '985' },
                  { value: '211', label: '211' },
                  { value: '双一流', label: '双一流' },
                  { value: '普通本科', label: '普通本科' },
                  { value: '专科', label: '专科' },
                ]}
              />
            </div>
            <Button
              onClick={() => {
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
            >
              重置
            </Button>
            <Button
              type="primary"
              onClick={() => {
                applyFiltersLocal()
                updateUrl({ keyword })
              }}
            >
              应用
            </Button>
            <Button disabled={!isAuthenticated} onClick={loadFromServer}>
              从服务端加载
            </Button>
          </div>
 
          <div className="glassPanel tabsWrap">
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
          </div>
 
          <div className="contentGrid">
            <div className="glassPanel leftList">
              <div className="leftTitle">点击选择院校对比分析</div>
              <Spin spinning={loading}>
                {schools.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无院校数据" />
                ) : (
                  <div className="schoolList">
                    {schools.map((s) => (
                      <div
                        key={s.name}
                        className={['schoolItem', activeSchool === s.name ? 'schoolItemActive' : ''].filter(Boolean).join(' ')}
                        onClick={() => selectSchool(s.name)}
                        title={s.name}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') selectSchool(s.name)
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.name}
                        </div>
                        <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>{s.province || ''}</div>
                        <Button
                          type="text"
                          size="small"
                          className={[
                            'compareBtn',
                            compareSchools.includes(s.name) ? 'compareBtnSelected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          icon={compareSchools.includes(s.name) ? <CheckOutlined /> : <PlusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCompareSchools((prev) => {
                              if (prev.includes(s.name)) return prev.filter((x) => x !== s.name)
                              if (prev.length >= 3) return prev
                              return [...prev, s.name]
                            })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Spin>
            </div>
 
            <div className="glassPanel mainCards">
              {tabKey === 'recommend' && (
                <>
                  <div className="cardGridTop">
                    <div className="placeholderCard placeholderCardClickable" onClick={() => setTabKey('detail')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setTabKey('detail') }}>
                      <div className="placeholderTitle">院校详情</div>
                      <div className="hintText">{activeSchool ? `已选择：${activeSchool}` : '请选择一所院校'}</div>
                      <div className="hintText" style={{ marginTop: 6 }}>
                        {activePlans.length ? `可用计划：${activePlans.length} 条` : '点击查看详情'}
                      </div>
                    </div>
                    <div className="placeholderCard placeholderCardClickable" onClick={() => setTabKey('trend')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setTabKey('trend') }}>
                      <div className="placeholderTitle">分数趋势</div>
                      <div className="hintText">趋势图（按年份/批次/省份）</div>
                    </div>
                    <div className="placeholderCard placeholderCardClickable" onClick={() => setTabKey('compare')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setTabKey('compare') }}>
                      <div className="placeholderTitle">院校对比</div>
                      <div className="hintText">已选：{compareSchools.length} / 3</div>
                    </div>
                  </div>
                  <div className="cardGridBottom">
                    <div className="placeholderCard placeholderCardClickable" onClick={() => setTabKey('detail')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setTabKey('detail') }}>
                      <div className="placeholderTitle">招生计划</div>
                      <div className="hintText">
                        {activePlans.length
                          ? `热门专业：${activePlans.filter((p) => p.major_name).slice(0, 1).map((p) => p.major_name).join('') || '-'}`
                          : '展示热门专业/计划人数等'}
                      </div>
                    </div>
                    <div className="placeholderCard placeholderCardClickable" onClick={() => setTabKey('detail')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setTabKey('detail') }}>
                      <div className="placeholderTitle">专业热度</div>
                      <div className="hintText">展示热门专业与录取分数区间</div>
                    </div>
                    <div className="placeholderCard">
                      <div className="placeholderTitle">AI建议</div>
                      <div className="hintText">基于分数位次给出策略建议（预留接口）</div>
                    </div>
                  </div>
                </>
              )}
 
              {tabKey === 'detail' && (
                <div className="detailWrap">
                  <div className="detailHeader">
                    <div className="detailHeaderLeft">
                      <div className="detailLogo" />
                      <div style={{ minWidth: 0 }}>
                        <div className="detailName">{activeSchool || '院校详情'}</div>
                        <div className="detailIntro">介绍……介绍</div>
                      </div>
                    </div>
                    <Button
                      className="detailAction"
                      onClick={() => {
                        if (!activeSchool) return
                        setWishlist((prev) => {
                          const next = prev.includes(activeSchool) ? prev.filter((x) => x !== activeSchool) : [activeSchool, ...prev]
                          return next
                        })
                        message.success(activeSchool && !inWishlist ? '已加入填报清单' : '已从填报清单移除')
                      }}
                    >
                      {inWishlist ? '已加入填报清单' : '加入填报清单'}
                    </Button>
                  </div>

                  <div className="detailGrid">
                    <div className="detailCardLarge">
                      <div className="detailCardTitle">历年投档分数线趋势</div>
                      <div className="detailCardBody">预留：后续接入趋势接口后绘制折线图/区间图</div>
                    </div>
                    <div className="detailCardLarge">
                      <div className="detailCardTitle">优势专业录取详情</div>
                      {activePlans.length === 0 ? (
                        <div className="detailCardBody">暂无数据</div>
                      ) : (
                        <div className="detailList">
                          {activePlans.slice(0, 5).map((p, idx) => (
                            <div key={`${p.school_code || ''}-${p.major_name || ''}-${idx}`} className="detailListItem">
                              <div style={{ minWidth: 0 }}>
                                <div className="detailListItemTitle">{p.major_name || '专业'}</div>
                                <div className="detailListItemMeta">
                                  {p.province || '-'} · {p.year || '-'} · {p.batch || '-'}
                                </div>
                              </div>
                              <div className="detailListItemRight">
                                <div>计划：{p.plan_count ?? '-'}</div>
                                <div>
                                  分数：{p.min_score ?? '-'} ~ {p.max_score ?? '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="detailCardSmall">
                      <div className="detailCardTitle">就业去向及薪资</div>
                      <div className="detailCardBody">预留：后续接入就业数据接口</div>
                    </div>
                    <div className="detailCardSmall">
                      <div className="detailCardTitle">招生计划概览</div>
                      <div className="detailCardBody">
                        {activePlans.length ? `当前已加载计划：${activePlans.length} 条` : '暂无计划数据'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
 
              {tabKey === 'trend' && (
                <div className="placeholderCard" style={{ minHeight: 360 }}>
                  <div className="placeholderTitle">分数趋势</div>
                  <div className="hintText">后续接入接口后展示折线图/区间图</div>
                </div>
              )}
 
              {tabKey === 'compare' && (
                <div className="placeholderCard" style={{ minHeight: 360 }}>
                  <div className="placeholderTitle">院校对比</div>
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
                  <div style={{ marginTop: 14, color: 'rgba(0,0,0,0.7)' }}>
                    {compareSchools.length === 0 ? '选择院校后，将展示层次、地区、热门专业与分数区间。' : `已选：${compareSchools.join('、')}`}
                  </div>
                  {compareSchools.length >= 2 && (
                    <div className="compareGrid">
                      {compareStats.map((s) => (
                        <div key={s.name} className="compareCard">
                          <div className="compareTitle">{s.name}</div>
                          <div className="compareMeta">
                            <div>地区：{s.province || '-'}</div>
                            <div>计划条目：{s.plansCount}</div>
                            <div>专业覆盖：{s.majorsCount}</div>
                            <div>分数区间：{s.minScore ?? '-'} ~ {s.maxScore ?? '-'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
 
              {tabKey === 'more' && (
                <div className="placeholderCard" style={{ minHeight: 360 }}>
                  <div className="placeholderTitle">更多能力</div>
                  <div className="hintText">可扩展：就业数据、专业画像、地区热力等</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
