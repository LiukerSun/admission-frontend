import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, Table, Button, Row, Col, Typography, Space, Tag, Empty, App } from 'antd'
import { FileTextOutlined, SendOutlined } from '@ant-design/icons'
import { admissionApi, type VolunteerPlan } from '@/services/admission'

const { Title, Text } = Typography

export default function VolunteerPlansPage() {
  const { message } = App.useApp()
  const [plans, setPlans] = useState<VolunteerPlan[]>([])
  const [activePlanId, setActivePlanId] = useState('')
  const [loading, setLoading] = useState(true)

  // 用于手动刷新或点击时的请求
  const fetchPlans = useCallback(async (targetId?: string) => {
    setLoading(true)
    try {
      const res = await admissionApi.listVolunteerPlans()
      if (res.data?.data) {
        const newPlans = res.data.data.plans
        setPlans(newPlans)
        if (targetId) {
          setActivePlanId(targetId)
        } else if (!activePlanId && newPlans.length > 0) {
          setActivePlanId(newPlans[0].id)
        }
      }
    } catch (error) {
      message.error('获取志愿方案失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [activePlanId, message])

  // 初始加载
  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        const res = await admissionApi.listVolunteerPlans()
        if (isMounted && res.data?.data) {
          const newPlans = res.data.data.plans
          setPlans(newPlans)
          if (newPlans.length > 0) {
            setActivePlanId(newPlans[0].id)
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    void init()
    return () => {
      isMounted = false
    }
  }, [])

  const activePlan = useMemo(() => {
    return plans.find(p => p.id === activePlanId) || plans[0]
  }, [activePlanId, plans])

  const handlePlanClick = (id: string) => {
    setActivePlanId(id)
    void fetchPlans(id)
  }

  const columns = useMemo(() => {
    if (!activePlan) return []
    return activePlan.columns.map(col => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
      render: (text: string) => text || '-'
    }))
  }, [activePlan])

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>志愿填报方案</Title>
        <Text type="secondary">查看已生成的志愿方案详情。</Text>
      </div>
      <Row gutter={[24, 24]}>
        {/* Left Column: Plan Selection */}
        <Col xs={24} lg={6}>
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <span>生成方案列表</span>
              </Space>
            }
            styles={{ body: { padding: '12px' } }}
            loading={loading && plans.length === 0}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              {plans.map((plan) => (
                <Button
                  key={plan.id}
                  type={activePlanId === plan.id ? 'primary' : 'default'}
                  block
                  onClick={() => handlePlanClick(plan.id)}
                  style={{ 
                    textAlign: 'left', 
                    height: 'auto', 
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Text 
                    strong 
                    style={{ 
                      color: activePlanId === plan.id ? '#fff' : 'inherit',
                      fontSize: '16px'
                    }}
                  >
                    {plan.name}
                  </Text>
                  {/* <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: '12px',
                      color: activePlanId === plan.id ? 'rgba(255,255,255,0.8)' : 'inherit'
                    }}
                  >
                    {plan.description}
                  </Text> */}
                </Button>
              ))}
              {plans.length === 0 && !loading && (
                <Empty description="暂无生成方案" />
              )}
            </Space>
          </Card>
        </Col>

        {/* Right Column: Data Table */}
        <Col xs={24} lg={18}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <SendOutlined />
                  <span>{activePlan?.name || '志愿详情'}</span>
                </Space>
                {activePlan && (
                  <Space>
                    <Tag color="blue">院校: {activePlan.stats.schoolCount}</Tag>
                    <Tag color="cyan">专业组: {activePlan.stats.groupCount}</Tag>
                    <Tag color="purple">总记录: {activePlan.stats.recordCount}</Tag>
                  </Space>
                )}
              </div>
            }
          >
            <Table
              dataSource={activePlan?.rows || []}
              columns={columns}
              rowKey="key"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              scroll={{ x: 'max-content' }}
              bordered
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
