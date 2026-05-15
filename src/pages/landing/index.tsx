import { Button, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  ReadOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './landing.css'

const featureCards = [
  {
    icon: <FileSearchOutlined />,
    title: '智能志愿推荐',
    desc: '以分数、位次、地域与专业偏好生成"冲稳保"方案，减少盲选和重复比较。',
    tone: 'peach',
  },
  {
    icon: <BarChartOutlined />,
    title: '录取数据洞察',
    desc: '近年录取分数、位次趋势与专业分布可视化，判断风险更直观。',
    tone: 'blue',
  },
  {
    icon: <RobotOutlined />,
    title: 'AI 智能问答',
    desc: '基于真实录取数据多轮对话，自动生成志愿草案并支持持续调优。',
    tone: 'teal',
  },
]

const quickLinks: Array<{ tag: string; title: string; meta: string; to: string }> = [
  { tag: '院校', title: '院校录取数据查询', meta: '近年分数 / 位次 / 招生计划', to: '/university' },
  { tag: 'AI', title: 'AI 志愿对话助手', meta: '基于真实数据回答志愿疑问', to: '/admission/ai' },
  { tag: '方案', title: '生成并导出志愿方案', meta: '冲稳保推荐 · Excel / PDF 导出', to: '/admission/plans' },
]

const workflowSteps = [
  {
    num: '01',
    title: '输入分数与省份',
    desc: '选择目标批次和省份，系统自动匹配可参考的院校与位次区间。',
  },
  {
    num: '02',
    title: '智能推荐与对话',
    desc: '算法生成"冲稳保"志愿方案，AI 对话辅助调整专业与院校组合。',
  },
  {
    num: '03',
    title: '一键导出方案',
    desc: '志愿草案支持 Excel / PDF / HTML 多格式导出，离线核对后再填报。',
  },
]

const planProgress = [
  { label: '确认省份批次', status: '完成' },
  { label: '生成推荐方案', status: '完成' },
  { label: '导出 Excel / PDF', status: '进行中' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const primaryCtaPath = isAuthenticated ? '/dashboard' : '/register'

  return (
    <div className="landingPage">
      <div className="landingContainer">
        <section className="landingHero">
          <div className="landingHeroGrid">
            <div className="landingHeroCopy">
              <div className="landingPill">
                <SafetyCertificateOutlined />
                高考志愿辅导智慧平台
              </div>
              <h1 className="landingHeroTitle">
                <span>精准数据导航</span>
                <span>决胜高考志愿</span>
              </h1>
              <p className="landingHeroSub">
                把院校库、录取趋势、AI 对话和志愿方案放在同一个清晰界面里，让志愿填报从焦虑猜测变成可验证的选择。
              </p>
              <div className="landingHeroPoints" aria-label="核心能力">
                <span>真实录取数据</span>
                <span>位次风险评估</span>
                <span>方案多格式导出</span>
              </div>
              <div className="landingHeroSearch">
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="搜索院校 / 专业 / 省份分数线"
                  onPressEnter={(e) => {
                    const val = (e.target as HTMLInputElement).value.trim()
                    navigate(val ? `/university?keyword=${encodeURIComponent(val)}` : '/university')
                  }}
                />
                <Button type="primary" size="large" onClick={() => navigate(primaryCtaPath)}>
                  立即开始
                </Button>
              </div>
            </div>

            <div className="landingHeroRight" aria-label="产品预览">
              <div className="heroInsightCard">
                <div className="heroInsightHeader">
                  <div>
                    <div className="eyebrow">志愿方案示例</div>
                    <strong>计算机类 · 黑龙江</strong>
                  </div>
                  <span className="riskBadge">示例</span>
                </div>
                <div className="scoreLine">
                  <span>634 分</span>
                  <div>
                    <i style={{ width: '82%' }} />
                  </div>
                  <em>位次 2,840</em>
                </div>
                <div className="chanceGrid">
                  <div>
                    <span>冲刺</span>
                    <strong>18%</strong>
                  </div>
                  <div>
                    <span>稳妥</span>
                    <strong>56%</strong>
                  </div>
                  <div>
                    <span>保底</span>
                    <strong>26%</strong>
                  </div>
                </div>
              </div>

              <div className="policyCard">
                <div className="eyebrow">快速入口</div>
                {quickLinks.map((item) => (
                  <button key={item.title} type="button" className="policyItem" onClick={() => navigate(item.to)}>
                    <span>{item.tag}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.meta}</p>
                    </div>
                    <ArrowRightOutlined />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="sectionTitleWrap">
          <span className="sectionKicker">Decision system</span>
          <h2 className="sectionTitle">全方位决策辅助系统</h2>
          <div className="sectionDivider" />
        </div>

        <section className="featureGrid" aria-label="核心功能">
          {featureCards.map((item) => (
            <div className={`featureCard featureCard-${item.tone}`} key={item.title}>
              <div className="featureIcon">{item.icon}</div>
              <h3 className="featureTitle">{item.title}</h3>
              <p className="featureDesc">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="collabGrid">
          <div className="collabCard">
            <span className="sectionKicker">Plan workflow</span>
            <h3 className="collabTitle">三步生成志愿方案</h3>
            <ul className="collabSteps">
              {workflowSteps.map((step) => (
                <li className="collabStep" key={step.num}>
                  <div className="collabNum">{step.num}</div>
                  <div>
                    <div className="collabStepTitle">{step.title}</div>
                    <p className="collabStepDesc">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="collabActions">
              <Button onClick={() => navigate('/university')}>查看院校库</Button>
              <Button type="primary" onClick={() => navigate(primaryCtaPath)}>
                立即体验
              </Button>
            </div>
          </div>

          <div className="collabPreviewCard" aria-label="方案生成进度示例">
            <div className="previewTop">
              <div>
                <div className="eyebrow">志愿方案示例</div>
                <strong>方案生成进度</strong>
              </div>
              <span>72%</span>
            </div>
            <div className="previewList">
              {planProgress.map((row) => (
                <div className="previewRow" key={row.label}>
                  <CheckCircleOutlined />
                  <span>{row.label}</span>
                  <em>{row.status}</em>
                </div>
              ))}
            </div>
            <div className="previewChart">
              <LineChartOutlined />
              <div className="chartBars">
                <i style={{ height: '44%' }} />
                <i style={{ height: '68%' }} />
                <i style={{ height: '52%' }} />
                <i style={{ height: '82%' }} />
                <i style={{ height: '60%' }} />
              </div>
            </div>
          </div>
        </section>

        <footer className="landingFooter">
          <div className="footerGrid">
            <div>
              <div className="footerColTitle">产品功能</div>
              <ul className="footerList">
                <li>院校录取查询</li>
                <li>AI 志愿对话</li>
                <li>智能志愿推荐</li>
                <li>方案多格式导出</li>
              </ul>
            </div>
            <div>
              <div className="footerColTitle">账户中心</div>
              <ul className="footerList">
                <li>注册 / 登录</li>
                <li>个人中心</li>
                <li>控制台</li>
                <li>会员订单</li>
              </ul>
            </div>
            <div>
              <div className="footerBrand">
                <ReadOutlined />
                智慧高考
              </div>
              <div className="footerText">让每一次选择都基于理性，让每一个梦想都拥有阶梯。</div>
            </div>
          </div>
          <div className="footerCopy">
            <div>智慧高考 ©2026</div>
            <div>高考志愿辅导智慧平台</div>
          </div>
        </footer>
      </div>
    </div>
  )
}
