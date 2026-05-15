import { useCallback, useMemo, useState } from 'react'
import { Modal, Spin } from 'antd'
import { CloseOutlined, CrownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { membershipApi, type MembershipPlan } from '@/services/membership'
import { usePaywallStore } from '@/stores/paywallStore'
import { formatMoney } from '@/utils/paymentFormat'
import './PaywallModal.css'

const DEFAULT_RECOMMENDED_PLAN = 'quarterly'

function isRecommendedPlan(planCode: string, recommendedCode?: string): boolean {
  return planCode === (recommendedCode || DEFAULT_RECOMMENDED_PLAN)
}

export default function PaywallModal() {
  const open = usePaywallStore((s) => s.open)
  const recommendedPlan = usePaywallStore((s) => s.recommendedPlan)
  const featureName = usePaywallStore((s) => s.featureName)
  const closePaywall = usePaywallStore((s) => s.closePaywall)
  const navigate = useNavigate()

  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string>(recommendedPlan || DEFAULT_RECOMMENDED_PLAN)

  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER),
      ),
    [plans],
  )

  const selectedPlan = useMemo(
    () => sortedPlans.find((p) => p.plan_code === selectedCode),
    [sortedPlans, selectedCode],
  )

  // Fetch on the Modal's open-change event (an event handler, not an effect),
  // so plans refresh every time the paywall is shown without tripping
  // react-hooks/set-state-in-effect.
  const handleAfterOpenChange = useCallback(
    async (isOpen: boolean) => {
      if (!isOpen) {
        setPlans([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await membershipApi.getPlans()
        const list = res.data.data ?? []
        setPlans(list)
        const hint = recommendedPlan || DEFAULT_RECOMMENDED_PLAN
        const fallback = list.find((p) => p.plan_code === hint) ?? list[0]
        if (fallback) setSelectedCode(fallback.plan_code)
      } catch {
        setPlans([])
      } finally {
        setLoading(false)
      }
    },
    [recommendedPlan],
  )

  const title = useMemo(() => {
    if (featureName) return `解锁 ${featureName}`
    return '解锁高级会员'
  }, [featureName])

  const handleUpgrade = () => {
    closePaywall()
    navigate(`/membership?plan=${encodeURIComponent(selectedCode)}`)
  }

  const handleViewAll = () => {
    closePaywall()
    navigate('/membership')
  }

  return (
    <Modal
      open={open}
      onCancel={closePaywall}
      afterOpenChange={handleAfterOpenChange}
      footer={null}
      closable={false}
      maskClosable
      keyboard={false}
      width={560}
      centered
      destroyOnClose
      styles={{
        body: { padding: 0 },
      }}
      rootClassName="paywall-modal-root"
    >
      <div className="paywall-modal">
        <button type="button" className="paywall-close" onClick={closePaywall} aria-label="关闭">
          <CloseOutlined />
        </button>

        <div className="paywall-header">
          <div className="paywall-crown">
            <CrownOutlined />
          </div>
          <h2 className="paywall-title">{title}</h2>
          <p className="paywall-subtitle">
            会员开通后立即解锁 AI 志愿分析、智能推荐与全量院校数据
          </p>
        </div>

        <div className="paywall-plans">
          {loading ? (
            <div className="paywall-loading">
              <Spin />
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="paywall-empty">暂无可购买套餐，请稍后再试。</div>
          ) : (
            sortedPlans.map((plan) => {
              const recommended = isRecommendedPlan(plan.plan_code, recommendedPlan)
              const selected = selectedCode === plan.plan_code
              return (
                <button
                  key={plan.plan_code}
                  type="button"
                  onClick={() => setSelectedCode(plan.plan_code)}
                  className={[
                    'paywall-plan',
                    selected ? 'paywall-plan--selected' : '',
                    recommended ? 'paywall-plan--recommended' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {recommended && <span className="paywall-plan-ribbon">最划算</span>}
                  <div className="paywall-plan-name">{plan.plan_name}</div>
                  <div className="paywall-plan-price">{formatMoney(plan.price_amount, plan.currency)}</div>
                  <div className="paywall-plan-duration">/ {plan.duration_days} 天</div>
                </button>
              )
            })
          )}
        </div>

        {selectedPlan?.description && (
          <p className="paywall-plan-description">{selectedPlan.description}</p>
        )}

        <button
          type="button"
          className="paywall-cta"
          onClick={handleUpgrade}
          disabled={loading || sortedPlans.length === 0}
        >
          立即开通
        </button>

        <button type="button" className="paywall-secondary" onClick={handleViewAll}>
          查看完整权益 →
        </button>
      </div>
    </Modal>
  )
}
