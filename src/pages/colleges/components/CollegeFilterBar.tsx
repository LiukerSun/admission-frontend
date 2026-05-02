import { Button, Input, Select } from 'antd'
import { FilterOutlined, SearchOutlined } from '@ant-design/icons'
import { GlassPanel } from '@/components/ui'
import styles from './CollegeFilterBar.module.css'

export type CollegeFilterBarProps = {
  keyword: string
  province?: string
  schoolType?: string
  schoolLevel?: string
  provinceOptions: Array<{ value: string; label: string }>
  schoolTypeOptions: Array<{ value: string; label: string }>
  schoolLevelOptions: Array<{ value: string; label: string }>
  canLoadFromServer: boolean
  onKeywordChange: (value: string) => void
  onProvinceChange: (value?: string) => void
  onSchoolTypeChange: (value?: string) => void
  onSchoolLevelChange: (value?: string) => void
  onReset: () => void
  onApply: () => void
  onLoadFromServer: () => void
  onEnter: () => void
}

export default function CollegeFilterBar({
  keyword,
  province,
  schoolType,
  schoolLevel,
  provinceOptions,
  schoolTypeOptions,
  schoolLevelOptions,
  canLoadFromServer,
  onKeywordChange,
  onProvinceChange,
  onSchoolTypeChange,
  onSchoolLevelChange,
  onReset,
  onApply,
  onLoadFromServer,
  onEnter,
}: CollegeFilterBarProps) {
  return (
    <GlassPanel padding="sm" className={styles.root}>
      <div className={styles.label}>
        <FilterOutlined />
        筛选
      </div>
      <div className={styles.fields}>
        <Input
          allowClear
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          prefix={<SearchOutlined />}
          placeholder="搜索院校名称"
          onPressEnter={onEnter}
        />
        <Select allowClear value={province} onChange={(v) => onProvinceChange(v)} placeholder="所在地区" options={provinceOptions} />
        <Select allowClear value={schoolType} onChange={(v) => onSchoolTypeChange(v)} placeholder="院校类别" options={schoolTypeOptions} />
        <Select allowClear value={schoolLevel} onChange={(v) => onSchoolLevelChange(v)} placeholder="院校层次" options={schoolLevelOptions} />
      </div>
      <Button onClick={onReset}>重置</Button>
      <Button type="primary" onClick={onApply}>
        应用
      </Button>
      <Button disabled={!canLoadFromServer} onClick={onLoadFromServer}>
        从服务端加载
      </Button>
    </GlassPanel>
  )
}

