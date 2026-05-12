import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Input, List, Spin, Typography, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { admissionApi, type University } from '@/services/admission'

export default function UniversitySearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const searchUniversities = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setUniversities([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await admissionApi.listUniversities({ q: q.trim() })
        setUniversities(res.data.data || [])
      } catch {
        setUniversities([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    searchUniversities(value)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        学校详情
      </Typography.Title>
      <Input
        size="large"
        allowClear
        prefix={<SearchOutlined />}
        placeholder="搜索学校名称或院校代码"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        style={{ marginBottom: 24 }}
      />
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      )}
      {!loading && query.trim() && universities.length === 0 && (
        <Empty description="未找到匹配的学校" />
      )}
      {!loading && universities.length > 0 && (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2 }}
          dataSource={universities}
          renderItem={(u) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => navigate(`/university/${u.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <Typography.Text strong>{u.name}</Typography.Text>
                <br />
                <Typography.Text type="secondary">代码: {u.university_code}</Typography.Text>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  )
}
