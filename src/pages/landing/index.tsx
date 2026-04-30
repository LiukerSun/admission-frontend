import { Button, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  FileSearchOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './landing.css'

const heroStats = [
  { value: '3步', label: '建立志愿路径' },
  { value: '12项', label: '关键偏好沉淀' },
  { value: '24h', label: '进度持续同步' },
]

const planningCards = [
  { title: '位次定位', desc: '先确认分数、位次与省份批次，建立可靠的筛选起点。', meta: '已完成 68%' },
  { title: '院校短名单', desc: '按城市、专业、成本与家庭共识，逐层收敛目标院校。', meta: '建议 18 所' },
  { title: '协作核对', desc: '家长与学生围绕同一份计划补充偏好、预算与风险。', meta: '3 项待确认' },
]

const featureCards = [
  {
    icon: <CompassOutlined />,
    title: '志愿短名单',
    tone: 'featureTitlePeach',
    desc: '以分数、位次、城市和专业偏好为线索，沉淀可反复讨论的院校短名单。',
  },
  {
    icon: <FileSearchOutlined />,
    title: '数据分析中心',
    tone: 'featureTitleBlue',
    desc: '把趋势、薪资和院校对比集中到同一个视图，让关键判断有据可查。',
  },
  {
    icon: <TeamOutlined />,
    title: '家庭协作',
    tone: 'featureTitleTeal',
    desc: '把零散问题转成可执行清单，帮助家庭围绕同一份计划沟通。',
  },
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
              <div className="landingPill">高考志愿辅导智慧平台</div>
              <h1 className="landingHeroTitle">
                把复杂志愿
                <br />
                变成清晰路径
              </h1>
              <p className="landingHeroSub">
                围绕分数位次、院校专业和家庭协作，把报考信息整理成可讨论、可追踪、可复盘的升学计划。
              </p>
              <ul className="landingHeroPoints">
                <li>院校与专业信息集中整理</li>
                <li>家长学生协同查看进度</li>
                <li>会员订单与服务状态可追踪</li>
              </ul>
              <div className="landingHeroSearch">
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="搜索院校/专业/省份分数线"
                  onPressEnter={() => navigate('/analysis')}
                />
                <Button type="primary" size="large" onClick={() => navigate(primaryCtaPath)}>
                  立即开始
                  <ArrowRightOutlined />
                </Button>
              </div>
              <div className="landingHeroStats" aria-label="平台规划能力概览">
                {heroStats.map((item) => (
                  <div className="landingHeroStat" key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="landingHeroRight">
              <div className="landingPreviewBoard" aria-label="志愿规划预览">
                <div className="landingPreviewTop">
                  <div>
                    <div className="landingPreviewLabel">今日规划</div>
                    <div className="landingPreviewTitle">从位次到志愿草案</div>
                  </div>
                  <span className="landingPreviewBadge">68%</span>
                </div>
                <div className="landingProgressBar">
                  <span style={{ width: '68%' }} />
                </div>
                <div className="landingPreviewCanvas" aria-label="智慧高考规划面板示意">
                  <div className="previewCanvasHeader">
                    <span>目标批次</span>
                    <strong>本科一批 · 华东优先</strong>
                  </div>
                  <div className="previewCanvasScore">
                    <div>
                      <span>预估位次</span>
                      <strong>18,420</strong>
                    </div>
                    <div>
                      <span>匹配院校</span>
                      <strong>36 所</strong>
                    </div>
                  </div>
                  <div className="previewCanvasBands">
                    <div className="previewBand previewBandReach">
                      <span>冲刺</span>
                      <i />
                      <strong>8</strong>
                    </div>
                    <div className="previewBand previewBandStable">
                      <span>稳妥</span>
                      <i />
                      <strong>18</strong>
                    </div>
                    <div className="previewBand previewBandSafe">
                      <span>保底</span>
                      <i />
                      <strong>10</strong>
                    </div>
                  </div>
                  <div className="previewCanvasFooter">
                    <span>计算机类</span>
                    <span>南京 / 杭州</span>
                    <span>预算已确认</span>
                  </div>
                </div>
                <div className="landingPreviewList">
                  {planningCards.map((item) => (
                    <div className="landingPreviewItem" key={item.title}>
                      <CheckCircleOutlined />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                      </div>
                      <span>{item.meta}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="landingSignalGrid">
                <div className="landingSignalCard">
                  <span>政策与数据</span>
                  <strong>批次、趋势、专业信息统一归档</strong>
                </div>
                <div className="landingSignalCard landingSignalCardAccent">
                  <span>家庭共识</span>
                  <strong>偏好、预算、风险同步确认</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landingTrustStrip" aria-label="核心工作流">
          <div>
            <span>01</span>
            <strong>确认位次</strong>
            <p>把分数与批次信息整理为可检索的起点。</p>
          </div>
          <div>
            <span>02</span>
            <strong>收敛选择</strong>
            <p>围绕城市、专业、成本逐层筛选。</p>
          </div>
          <div>
            <span>03</span>
            <strong>协作复盘</strong>
            <p>家长学生同步核对，减少反复沟通。</p>
          </div>
        </section>

        <section className="landingShowcase">
          <div className="landingShowcaseCopy">
            <div className="sectionKicker">工作台能力</div>
            <h2 className="sectionTitle">从数据到协作的报考工作台</h2>
            <p className="sectionLead">
              把资料查询、院校比较、家庭讨论和服务进度放在同一条路径里，少一点临时决策，多一点可追踪的依据。
            </p>
          </div>

          <div className="featureGrid">
            {featureCards.map((feature) => (
              <div className="featureCard" key={feature.title}>
                <div className={`featureIcon ${feature.tone}`}>{feature.icon}</div>
                <h3 className={`featureTitle ${feature.tone}`}>{feature.title}</h3>
                <p className="featureDesc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="collabGrid">
          <div className="collabCard">
            <div className="sectionKicker">协作流程</div>
            <h3 className="collabTitle">家长与学生的清晰协同</h3>
            <ul className="collabSteps">
              <li className="collabStep">
                <div className="collabNum">01</div>
                <div>
                  <div className="collabStepTitle">一键绑定关系</div>
                  <p className="collabStepDesc">家长发起绑定，学生确认后即可围绕同一份填报计划沟通。</p>
                </div>
              </li>
              <li className="collabStep">
                <div className="collabNum">02</div>
                <div>
                  <div className="collabStepTitle">同步查看进度</div>
                  <p className="collabStepDesc">家长关注城市、成本和服务状态，学生专注专业兴趣与院校偏好。</p>
                </div>
              </li>
              <li className="collabStep">
                <div className="collabNum">03</div>
                <div>
                  <div className="collabStepTitle">协作清单导出</div>
                  <p className="collabStepDesc">支持导出草案，线下核对无误后再进行最终志愿填报。</p>
                </div>
              </li>
            </ul>
            <div className="landingButtonRow">
              <Button onClick={() => navigate(primaryCtaPath)}>开始协作</Button>
              <Button type="primary" onClick={() => navigate('/bindings')}>
                管理绑定
              </Button>
            </div>
          </div>
          <div className="collabPreviewCard">
            <div className="landingPreviewLabel">协作概览</div>
            <div className="landingChecklist">
              <span>
                <CheckCircleOutlined />
                学生确认兴趣方向
              </span>
              <span>
                <CheckCircleOutlined />
                家长补充预算和城市偏好
              </span>
              <span>
                <CheckCircleOutlined />
                共同导出志愿草案
              </span>
            </div>
            <div className="collabNote">
              <strong>本周建议</strong>
              <p>先锁定 3 个目标城市，再对专业方向做一次家庭共识复盘。</p>
            </div>
          </div>
        </section>

        <footer className="landingFooter">
          <div className="footerGrid">
            <div>
              <div className="footerColTitle">产品功能</div>
              <ul className="footerList">
                <li>一分一段表查询</li>
                <li>志愿短名单整理</li>
                <li>专业薪资报告</li>
                <li>会员服务状态</li>
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
              <div className="footerBrand">智慧高考</div>
              <div className="footerDescription">
                让每一次选择都基于更清楚的信息，让家庭讨论少一点焦虑，多一点确定。
              </div>
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
