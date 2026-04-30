import { Button, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import { SearchOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './landing.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const primaryCtaPath = isAuthenticated ? '/dashboard' : '/register'

  return (
    <div className="landingPage">
      <div className="landingContainer">
        <section className="landingHero">
          <div className="landingHeroGrid">
            <div>
              <div className="landingPill">高考志愿辅导智慧平台</div>
              <h1 className="landingHeroTitle">
                精准数据导航
                <br />
                决胜高考志愿
              </h1>
              <p className="landingHeroSub">基于百万级招录数据与AI深度算法，为每一位学子打造个性化的升学路径规划。</p>
              <ul className="landingHeroPoints">
                <li>官方直连数据</li>
                <li>薪资真实反馈</li>
                <li>专家人工审核</li>
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
                </Button>
              </div>
            </div>
            <div className="landingHeroRight">
              <div className="glassCard">
                <div className="glassCardInner">
                  <div style={{ fontWeight: 800, fontSize: 18 }}>轮播图</div>
                </div>
              </div>
              <div className="glassCard">
                <div className="glassCardInner">
                  <div style={{ fontWeight: 800, fontSize: 18 }}>（新闻专区-最新政策等）</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sectionTitleWrap">
          <h2 className="sectionTitle">全方位决策辅助系统</h2>
          <div className="sectionDivider" />
        </div>

        <section className="featureGrid">
          <div className="featureCard">
            <h3 className="featureTitle featureTitlePeach">精准推荐系统</h3>
            <p className="featureDesc">“冲稳保”三维评估模型，根据您的分数位次，为您量身定制填报策略。</p>
          </div>
          <div className="featureCard">
            <h3 className="featureTitle featureTitleBlue">数据可视化中心</h3>
            <p className="featureDesc">近五年招录趋势一日了然，热力图展示各省份竞争烈度，辅助科学决策。</p>
          </div>
          <div className="featureCard">
            <h3 className="featureTitle featureTitleTeal">AI志愿规划师</h3>
            <p className="featureDesc">对话式智能助手，为您实时解答专业选择、位次换算等复杂问题。</p>
          </div>
        </section>

        <section className="collabGrid">
          <div className="collabCard">
            <h3 className="collabTitle">家长与学生的智能协同</h3>
            <ul className="collabSteps">
              <li className="collabStep">
                <div className="collabNum">01</div>
                <div>
                  <div className="collabStepTitle">一键绑定关系</div>
                  <p className="collabStepDesc">家长发起扫码，学生确认后即可实时同步填报进度，打破沟通信息茧房。</p>
                </div>
              </li>
              <li className="collabStep">
                <div className="collabNum">02</div>
                <div>
                  <div className="collabStepTitle">多端同步分析</div>
                  <p className="collabStepDesc">家长查看市场薪资趋势，学生专注专业兴趣探索，共同商议最优路径。</p>
                </div>
              </li>
              <li className="collabStep">
                <div className="collabNum">03</div>
                <div>
                  <div className="collabStepTitle">协作清单导出</div>
                  <p className="collabStepDesc">支持导出 PDF/CSV 格式的志愿草案，线下核对无误后再行录入系统。</p>
                </div>
              </li>
            </ul>
            <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate(primaryCtaPath)}>开始协作</Button>
              <Button type="primary" onClick={() => navigate('/bindings')}>模拟填报</Button>
            </div>
          </div>
          <div className="glassCard">
            <div className="glassCardInner">
              <div style={{ fontWeight: 800, fontSize: 18 }}>协作面板</div>
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
              <div className="footerBrand">智慧高考</div>
              <div style={{ color: 'rgba(0,0,0,0.7)', lineHeight: 1.75 }}>
                让每一次选择都基于理性，让每一个梦想都拥有阶梯。2026年度最专业的志愿辅导平台。
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
