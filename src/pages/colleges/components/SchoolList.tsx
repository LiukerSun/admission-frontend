import { Spin } from 'antd'
import { GlassPanel, EmptyState } from '@/components/ui'
import SchoolListItem from './SchoolListItem'
import styles from './SchoolList.module.css'

export type SchoolListProps = {
  title: string
  loading?: boolean
  schools: Array<{ name: string; province?: string }>
  activeSchool?: string
  compareSchools: string[]
  onSelectSchool: (name: string) => void
  onToggleCompare: (name: string) => void
}

export default function SchoolList({
  title,
  loading,
  schools,
  activeSchool,
  compareSchools,
  onSelectSchool,
  onToggleCompare,
}: SchoolListProps) {
  return (
    <GlassPanel padding="sm" className={styles.root}>
      <div className={styles.title}>{title}</div>
      <Spin spinning={Boolean(loading)}>
        {schools.length === 0 ? (
          <EmptyState size="sm" title="暂无院校数据" description="请调整筛选条件或从服务端加载" />
        ) : (
          <div className={styles.list}>
            {schools.map((s) => (
              <SchoolListItem
                key={s.name}
                name={s.name}
                province={s.province}
                active={activeSchool === s.name}
                compareSelected={compareSchools.includes(s.name)}
                compareDisabled={!compareSchools.includes(s.name) && compareSchools.length >= 3}
                onSelect={() => onSelectSchool(s.name)}
                onToggleCompare={() => onToggleCompare(s.name)}
              />
            ))}
          </div>
        )}
      </Spin>
    </GlassPanel>
  )
}

