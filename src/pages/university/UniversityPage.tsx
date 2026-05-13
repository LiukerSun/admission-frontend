import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { admissionApi, type AdmissionLine, type UniversityProfile, type University } from '@/services/admission'
import GroupSidebar, { type GroupInfo } from './GroupSidebar'
import MajorPanel from './MajorPanel'
import DataCharts from './DataCharts'
import InfoPanel from './InfoPanel'
import './UniversityPage.css'

function groupLinesByGroupCode(lines: AdmissionLine[]): Map<string, AdmissionLine[]> {
  const groups = new Map<string, AdmissionLine[]>()
  for (const line of lines) {
    const code = line.group_code || '未分组'
    const existing = groups.get(code) || []
    existing.push(line)
    groups.set(code, existing)
  }
  return groups
}

export default function UniversityPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const universityId = Number(id)

  const [lines, setLines] = useState<AdmissionLine[]>([])
  const [profile, setProfile] = useState<UniversityProfile | null>(null)
  const [university, setUniversity] = useState<University | null>(null)
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null)
  const [selectedMajor, setSelectedMajor] = useState<AdmissionLine | null>(null)
  const [loading, setLoading] = useState(false)

  const groupMap = useMemo(() => groupLinesByGroupCode(lines), [lines])
  const groups = useMemo<GroupInfo[]>(() => {
    return Array.from(groupMap.entries()).map(([code, groupLines]) => {
      const firstLine = groupLines[0]
      const minScore = Math.min(
        ...groupLines.map((l) => l.min_score ?? Infinity).filter((s) => s !== Infinity)
      )
      const minRank = Math.min(
        ...groupLines.map((l) => l.min_rank ?? Infinity).filter((s) => s !== Infinity)
      )
      return {
        code,
        name: firstLine?.group_major_names || firstLine?.subject_requirement_name || '',
        lineCount: groupLines.length,
        minScore: minScore === Infinity ? undefined : minScore,
        minRank: minRank === Infinity ? undefined : minRank,
      }
    })
  }, [groupMap])
  const selectedGroupLines = useMemo(
    () => (selectedGroupCode ? groupMap.get(selectedGroupCode) || [] : []),
    [selectedGroupCode, groupMap]
  )

  const handleSelectGroup = useCallback((code: string | null) => {
    setSelectedGroupCode(code)
    setSelectedMajor(null)
  }, [])

  const handleSelectMajor = useCallback((major: AdmissionLine) => {
    setSelectedMajor((prev) =>
      prev?.university_major_line_id === major.university_major_line_id
        ? null
        : major
    )
  }, [])

  const handleSwitchUniversity = useCallback((u: University) => {
    navigate(`/university/${u.id}`)
  }, [navigate])

  useEffect(() => {
    if (!universityId || Number.isNaN(universityId)) {
      message.error('无效的学校ID')
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setLines([])
      setProfile(null)
      setUniversity(null)
      setSelectedGroupCode(null)
      setSelectedMajor(null)

      try {
        const [linesRes, profileRes, uniRes] = await Promise.all([
          admissionApi.listAdmissionLines({ university_ids: String(universityId) }),
          admissionApi.getUniversityProfile(universityId),
          admissionApi.listUniversities({ q: '' }),
        ])

        if (cancelled) return

        const dataLines = linesRes.data.data || []
        setLines(dataLines)
        setProfile(profileRes.data.data || null)

        const matchedUni = (uniRes.data.data || []).find((u) => u.id === universityId)
        if (matchedUni) {
          setUniversity(matchedUni)
        } else {
          // fallback: use first line's university info
          const first = dataLines[0]
          if (first) {
            setUniversity({
              id: universityId,
              name: first.university_name || '',
              university_code: first.university_code || '',
              normalized_name: first.university_name || '',
            })
          }
        }
      } catch {
        if (!cancelled) message.error('学校数据加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [universityId])

  if (!universityId || Number.isNaN(universityId)) {
    return <div style={{ padding: 40, textAlign: 'center' }}>无效的学校ID</div>
  }

  return (
    <div className="university-page">
      <div className="university-layout">
        {/* 左侧：专业组 */}
        <div className="university-left">
          <GroupSidebar
            university={university}
            profile={profile}
            groups={groups}
            selectedGroupCode={selectedGroupCode}
            onSelectGroup={handleSelectGroup}
            onSwitchUniversity={handleSwitchUniversity}
            loading={loading}
          />
        </div>

        {/* 中间：图表 + 信息 */}
        <div className="university-center">
          <div className="university-charts">
            <DataCharts
              universityId={universityId}
              selectedGroupCode={selectedGroupCode}
              selectedMajor={selectedMajor}
              loading={loading}
            />
          </div>
          <div className="university-info">
            <InfoPanel
              profile={profile}
              selectedMajor={selectedMajor}
              selectedGroupLines={selectedGroupLines}
              university={university}
              loading={loading}
            />
          </div>
        </div>

        {/* 右侧：专业 */}
        <div className="university-right">
          <MajorPanel
            lines={selectedGroupCode ? selectedGroupLines : lines}
            selectedMajor={selectedMajor}
            onSelectMajor={handleSelectMajor}
            groupCode={selectedGroupCode}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
