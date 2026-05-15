import { useMemo, useState, useEffect } from 'react'
import { List, Tag, Typography, Empty, Spin, Pagination } from 'antd'
import type { AdmissionLine } from '@/services/admission'

interface MajorPanelProps {
  lines: AdmissionLine[]
  selectedMajor: AdmissionLine | null
  onSelectMajor: (major: AdmissionLine) => void
  groupCode: string | null
  loading: boolean
}

const PAGE_SIZE = 15

export default function MajorPanel({
  lines,
  selectedMajor,
  onSelectMajor,
  groupCode,
  loading,
}: MajorPanelProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const header = groupCode ? `专业组 ${groupCode}` : '全部专业'
  const count = lines.length

  useEffect(() => {
    const id = setTimeout(() => setCurrentPage(1), 0)
    return () => clearTimeout(id)
  }, [groupCode, lines.length])

  const currentLines = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return lines.slice(start, start + PAGE_SIZE)
  }, [lines, currentPage])

  return (
    <div className="major-panel">
      <div className="major-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Typography.Text strong>{header}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            共 {count} 个
          </Typography.Text>
        </div>
      </div>

      {loading && lines.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="small" />
        </div>
      ) : lines.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" style={{ marginTop: 24 }} />
      ) : (
        <>
          <div className="major-list-scrollable">
            <List
              size="small"
              dataSource={currentLines}
              renderItem={(line) => {
                const isSelected = selectedMajor?.university_major_line_id === line.university_major_line_id
                return (
                  <List.Item
                    className={`major-list-item ${isSelected ? 'major-list-item-active' : ''}`}
                    onClick={() => onSelectMajor(line)}
                    style={{ cursor: 'pointer', padding: '10px 12px' }}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <Typography.Text strong style={{ fontSize: 13, color: isSelected ? '#1E40AF' : undefined }}>
                          {line.local_major_name || '-'}
                        </Typography.Text>
                        {line.admitted_count !== undefined && (
                          <Tag>{line.admitted_count}人</Tag>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {line.local_major_code || '-'}
                        </Typography.Text>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {line.min_score !== undefined && (
                            <Tag color="blue">{line.min_score}分</Tag>
                          )}
                          {line.min_rank !== undefined && (
                            <Tag color="geekblue">{line.min_rank}位</Tag>
                          )}
                        </div>
                      </div>
                      {line.subject_requirement_name && (
                        <div style={{ marginTop: 4 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            选科: {line.subject_requirement_name}
                          </Typography.Text>
                        </div>
                      )}
                    </div>
                  </List.Item>
                )
              }}
              style={{ border: '1px solid #E9EEF6', borderRadius: 6 }}
            />
          </div>
          {count > PAGE_SIZE && (
            <div style={{ padding: '8px 0', textAlign: 'center', flexShrink: 0 }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={count}
                onChange={setCurrentPage}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
