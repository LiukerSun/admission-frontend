import { Button } from 'antd'
import { CheckOutlined, PlusOutlined } from '@ant-design/icons'
import { ActionListItem } from '@/components/ui'
import styles from './SchoolListItem.module.css'

export type SchoolListItemProps = {
  name: string
  province?: string
  active?: boolean
  compareSelected?: boolean
  compareDisabled?: boolean
  onSelect: () => void
  onToggleCompare: () => void
}

export default function SchoolListItem({
  name,
  province,
  active,
  compareSelected,
  compareDisabled,
  onSelect,
  onToggleCompare,
}: SchoolListItemProps) {
  return (
    <ActionListItem
      className={styles.root}
      title={name}
      right={<span className={styles.province}>{province || ''}</span>}
      active={active}
      onClick={onSelect}
      actions={
        <Button
          type="text"
          size="small"
          className={[styles.compareBtn, compareSelected ? styles.compareBtnSelected : ''].filter(Boolean).join(' ')}
          icon={compareSelected ? <CheckOutlined /> : <PlusOutlined />}
          disabled={compareDisabled}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCompare()
          }}
        />
      }
    />
  )
}

