import { useState, useRef, useCallback } from 'react'
import { Card, Input, List, Tag, Spin, Typography, Empty } from 'antd'
import { SearchOutlined, BankOutlined } from '@ant-design/icons'
import { admissionApi, type University, type UniversityProfile } from '@/services/admission'

export interface GroupInfo {
  code: string
  name: string
  lineCount: number
  minScore?: number
  minRank?: number
}

interface GroupSidebarProps {
  university: University | null
  profile: UniversityProfile | null
  groups: GroupInfo[]
  selectedGroupCode: string | null
  onSelectGroup: (code: string | null) => void
  onSwitchUniversity: (u: University) => void
  loading: boolean
}

export default function GroupSidebar({
  university,
  profile,
  groups,
  selectedGroupCode,
  onSelectGroup,
  onSwitchUniversity,
  loading,
}: GroupSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<University[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const searchUniversities = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await admissionApi.listUniversities({ q: q.trim() })
        setSearchResults(res.data.data || [])
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    searchUniversities(value)
  }

  const handleSelectUniversity = (u: University) => {
    onSwitchUniversity(u)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  const tags = [
    profile?.is_985 && <Tag color="red">985</Tag>,
    profile?.is_211 && <Tag color="orange">211</Tag>,
    profile?.is_double_first_class && <Tag color="blue">双一流</Tag>,
    profile?.is_national_key && <Tag color="green">国重点</Tag>,
    profile?.has_postgraduate_recommendation && <Tag color="purple">推免</Tag>,
  ].filter(Boolean)

  return (
    <div className="group-sidebar">
      {/* 学校信息卡片 */}
      <Card className="university-card" size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <BankOutlined style={{ fontSize: 20, color: '#1E40AF' }} />
          <Typography.Text strong style={{ fontSize: 15 }}>
            {university?.name || '加载中...'}
          </Typography.Text>
        </div>
        {university?.university_code && (
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            院校代码: {university.university_code}
          </Typography.Text>
        )}
        {profile && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tags}
            {profile.city && <Tag>{profile.city}</Tag>}
            {profile.ownership_type_name && <Tag>{profile.ownership_type_name}</Tag>}
          </div>
        )}
      </Card>

      {/* 搜索学校 */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Input
          size="small"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索切换学校"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => searchQuery.trim() && setShowResults(true)}
        />
        {showResults && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10,
              background: '#fff',
              border: '1px solid #E9EEF6',
              borderRadius: 6,
              maxHeight: 240,
              overflow: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            {searching && (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <Spin size="small" />
              </div>
            )}
            {!searching && searchResults.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到学校" style={{ padding: 16 }} />
            )}
            {!searching &&
              searchResults.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                  className="university-search-item"
                  onClick={() => handleSelectUniversity(u)}
                >
                  <Typography.Text strong>{u.name}</Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {u.university_code}
                  </Typography.Text>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 专业组列表 */}
      <div className="group-list-header">
        <Typography.Text strong>专业组</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          共 {groups.length} 个
        </Typography.Text>
      </div>

      {loading && groups.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="small" />
        </div>
      ) : groups.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" style={{ marginTop: 24 }} />
      ) : (
        <List
          size="small"
          dataSource={groups}
          renderItem={(group) => (
            <List.Item
              className={`group-list-item ${selectedGroupCode === group.code ? 'group-list-item-active' : ''}`}
              onClick={() => onSelectGroup(group.code === selectedGroupCode ? null : group.code)}
              style={{ cursor: 'pointer', padding: '8px 12px' }}
            >
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Tag color={selectedGroupCode === group.code ? '#1E40AF' : 'default'}>
                    {group.code}
                  </Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {group.lineCount} 个专业
                  </Typography.Text>
                </div>
                {group.name && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {group.name}
                  </Typography.Text>
                )}
                {(group.minScore !== undefined || group.minRank !== undefined) && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {group.minScore !== undefined && (
                      <Tag color="blue" style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>{group.minScore}分</Tag>
                    )}
                    {group.minRank !== undefined && (
                      <Tag color="geekblue" style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>{group.minRank}位</Tag>
                    )}
                  </div>
                )}
              </div>
            </List.Item>
          )}
          style={{ border: '1px solid #E9EEF6', borderRadius: 6 }}
        />
      )}
    </div>
  )
}
