import { Button, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  LineChartOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './landing.css'

const featureCards = [
  {
    icon: <FileSearchOutlined />,
    title: '精准推荐系统',
    desc: '以分数、位次、地域与专业偏好生成“冲稳保”方案，减少盲选和重复比较。',
    tone: 'peach',
  },
  {
    icon: <BarChartOutlined />,
    title: '数据可视化中心',
    desc: '近五年录取趋势、专业热度和城市机会集中呈现，判断风险更直观。',
    tone: 'blue',
  },
  {
    icon: <TeamOutlined />,
    title: '家庭协同决策',
    desc: '学生、家长共享收藏和草案，用同一份依据讨论志愿，不再各查各的。',
    tone: 'teal',
  },
]

const policyItems = [
  { tag: '政策', title: '2026 志愿填报节点提醒', meta: '按省份自动同步关键时间' },
  { tag: '数据', title: '热门专业录取趋势更新', meta: '覆盖近五年分数与位次' },
  { tag: '指南', title: '冲稳保比例怎么设定', meta: '面向不同分段给出策略' },
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
                把院校库、专业趋势、薪资反馈和家庭协同放在同一个清晰界面里，让志愿填报从焦虑猜测变成可验证的选择。
              </p>
              <div className="landingHeroPoints" aria-label="核心能力">
                <span>官方直连数据</span>
                <span>位次风险评估</span>
                <span>协作方案导出</span>
              </div>
              <div className="landingHeroSearch">
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="搜索院校 / 专业 / 省份分数线"
                  onPressEnter={() => navigate('/analysis')}
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
                    <div className="eyebrow">志愿方案快照</div>
                    <strong>计算机类 · 黑龙江</strong>
                  </div>
                  <span className="riskBadge">稳妥</span>
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
                <div className="eyebrow">政策与数据更新</div>
                {policyItems.map((item) => (
                  <button key={item.title} type="button" className="policyItem" onClick={() => navigate('/colleges')}>
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
            <span className="sectionKicker">Family workflow</span>
            <h3 className="collabTitle">家长与学生的智能协同</h3>
            <ul className="collabSteps">
              <li className="collabStep">
                <div className="collabNum">01</div>
                <div>
                  <div className="collabStepTitle">一键绑定关系</div>
                  <p className="collabStepDesc">家长发起扫码，学生确认后同步填报进度，减少反复截图和口头转述。</p>
                </div>
              </li>
              <li className="collabStep">
                <div className="collabNum">02</div>
                <div>
                  <div className="collabStepTitle">多端同步分析</div>
                  <p className="collabStepDesc">家长关注就业和成本，学生关注专业兴趣，系统保留每次讨论的依据。</p>
                </div>
              </li>
              <li className="collabStep">
                <div className="collabNum">03</div>
                <div>
                  <div className="collabStepTitle">协作清单导出</div>
                  <p className="collabStepDesc">志愿草案可导出 PDF/CSV，线下核对后再进入最终填报。</p>
                </div>
              </li>
            </ul>
            <div className="collabActions">
              <Button onClick={() => navigate(primaryCtaPath)}>开始协作</Button>
              <Button type="primary" onClick={() => navigate('/bindings')}>
                模拟填报
              </Button>
            </div>
          </div>

          <div className="collabPreviewCard" aria-label="协作面板预览">
            <div className="previewTop">
              <div>
                <div className="eyebrow">共享草案</div>
                <strong>家庭讨论进度</strong>
              </div>
              <span>72%</span>
            </div>
            <div className="previewList">
              {['确认省份批次', '筛选目标院校', '对比专业前景'].map((label, index) => (
                <div className="previewRow" key={label}>
                  <CheckCircleOutlined />
                  <span>{label}</span>
                  <em>{index === 2 ? '进行中' : '完成'}</em>
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
                <li>一分一段表查询</li>
                <li>智能志愿推荐</li>
                <li>专业薪资报告</li>
                <li>院校实力对比</li>
              </ul>
            </div>
            <div>
              <div className="footerColTitle">资源中心</div>
              <ul className="footerList">
                <li>官方跳转链接</li>
                <li>高考政策解读</li>
                <li>数据导出教程</li>
                <li>帮助中心</li>
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
