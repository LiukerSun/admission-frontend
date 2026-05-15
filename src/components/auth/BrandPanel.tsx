import {
  BarChartOutlined,
  FileSearchOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'

const FEATURES = [
  {
    icon: <FileSearchOutlined />,
    title: '智能志愿推荐',
    desc: '分数·位次·偏好生成"冲稳保"方案',
  },
  {
    icon: <BarChartOutlined />,
    title: '录取数据洞察',
    desc: '近年位次趋势与专业分布可视化',
  },
  {
    icon: <RobotOutlined />,
    title: 'AI 智能问答',
    desc: '基于真实数据的多轮志愿对话',
  },
]

export default function BrandPanel() {
  return (
    <aside className="brand-panel" aria-hidden="false">
      <svg
        className="brand-decoration"
        viewBox="0 0 600 800"
        preserveAspectRatio="xMaxYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="decoStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>
        <circle cx="540" cy="120" r="160" fill="none" stroke="url(#decoStroke)" strokeWidth="1.2" />
        <circle cx="540" cy="120" r="240" fill="none" stroke="url(#decoStroke)" strokeWidth="0.8" />
        <circle cx="540" cy="120" r="320" fill="none" stroke="url(#decoStroke)" strokeWidth="0.5" />
        <path
          d="M 80 720 Q 240 600 380 700 T 600 660"
          fill="none"
          stroke="url(#decoStroke)"
          strokeWidth="1"
        />
      </svg>

      <div className="brand-mark">
        <span className="brand-mark-icon" aria-hidden="true">
          <SafetyCertificateOutlined />
        </span>
        <span>高考志愿辅导智慧平台</span>
      </div>

      <div className="brand-body">
        <span className="brand-eyebrow">Data · Insight · Decision</span>
        <h2 className="brand-title">
          精准数据导航<br />
          <span className="accent">决胜高考志愿</span>
        </h2>
        <p className="brand-tagline">
          把院校库、录取趋势、AI 对话和志愿方案放在同一个清晰界面里，
          让志愿填报从焦虑猜测变成可验证的选择。
        </p>

        <div className="brand-features" aria-label="核心能力">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="brand-feature">
              <span className="brand-feature-icon" aria-hidden="true">{feature.icon}</span>
              <div className="brand-feature-text">
                <span className="brand-feature-title">{feature.title}</span>
                <span className="brand-feature-desc">{feature.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="brand-footer">© {new Date().getFullYear()} 高考志愿辅导智慧平台</div>
    </aside>
  )
}
