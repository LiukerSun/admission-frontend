import { useEffect, useState, useCallback } from 'react'
import { Table, Button, message, Modal } from 'antd'
import { adminApi, type BindingListItem } from '@/services/admin'

export default function AdminBindingsPage() {
  const [bindings, setBindings] = useState<BindingListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const fetchBindings = useCallback(() => {
    setLoading(true)
    adminApi.getBindings({ page, page_size: pageSize })
      .then((res) => {
        setBindings(res.data.data.bindings ?? [])
        setTotal(res.data.data.total ?? 0)
      })
      .catch((err) => { console.error(err); message.error('加载绑定列表失败') })
      .finally(() => setLoading(false))
  }, [page, pageSize])

  useEffect(() => {
    void fetchBindings()
  }, [fetchBindings])

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认解除该绑定？',
      content: '此操作不可恢复',
      onOk: () => {
        adminApi.deleteBinding(id)
          .then(() => {
            message.success('已解除绑定')
            fetchBindings()
          })
          .catch((err) => { console.error(err); message.error('操作失败') })
      },
    })
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: '家长邮箱',
      key: 'parent_email',
      render: (_: unknown, record: BindingListItem) => record.parent?.email || '-',
    },
    {
      title: '学生邮箱',
      key: 'student_email',
      render: (_: unknown, record: BindingListItem) => record.student?.email || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: BindingListItem) => (
        <Button type="link" danger onClick={() => handleDelete(record.id!)}>
          解除绑定
        </Button>
      ),
    },
  ]

  return (
    <div>
      <h2>绑定管理</h2>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={bindings}
        loading={loading}
        style={{ marginTop: 16 }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
    </div>
  )
}
