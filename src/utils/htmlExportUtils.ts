import { type RichVolunteerPlan } from '@/services/admission'

interface ExamInfo {
  name: string
  examNumber?: string
  score: number
  rank: number
  province: string
  category: string
}

export const getChartData = (plan: RichVolunteerPlan) => {
  // 准备图表数据
  const groups = plan.detailedGroups || []
  const sortedGroups = [...groups].sort((a, b) => a.orderNo - b.orderNo)
  const orderNos = sortedGroups.map(g => g.orderNo)
  const data2024 = sortedGroups.map(g => g.groupAdmissionDetails?.minScore2024 ?? null)
  const data2023 = sortedGroups.map(g => g.groupAdmissionDetails?.minScore2023 ?? null)
  const data2022 = sortedGroups.map(g => g.groupAdmissionDetails?.minScore2022 ?? null)

  const hasData2024 = data2024.some(v => v !== null && v > 0)
  const hasData2023 = data2023.some(v => v !== null && v > 0)
  const hasData2022 = data2022.some(v => v !== null && v > 0)

  interface SeriesItem {
    name: string
    type: string
    data: (number | null)[]
    lineStyle?: { color: string; width: number }
    symbol?: string
    symbolSize?: number
    itemStyle?: { color: string }
    connectNulls?: boolean
    smooth?: boolean
  }
  const series: SeriesItem[] = []
  if (hasData2024) {
    series.push({
      name: '2024年等位分',
      type: 'line',
      data: data2024,
      lineStyle: { color: '#D4A843', width: 3 },
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: '#D4A843' },
      connectNulls: false,
      smooth: true,
    })
  }
  if (hasData2023) {
    series.push({
      name: '2023年等位分',
      type: 'line',
      data: data2023,
      lineStyle: { color: '#2D6A4F', width: 3 },
      symbol: 'diamond',
      symbolSize: 8,
      itemStyle: { color: '#2D6A4F' },
      connectNulls: false,
      smooth: true,
    })
  }
  if (hasData2022) {
    series.push({
      name: '2022年等位分',
      type: 'line',
      data: data2022,
      lineStyle: { color: '#9CA3AF', width: 3 },
      symbol: 'triangle',
      symbolSize: 8,
      itemStyle: { color: '#9CA3AF' },
      connectNulls: false,
      smooth: true,
    })
  }
  const hasAnyTrendData = series.length > 0
  return { hasAnyTrendData, series, orderNos, sortedGroups, hasData2024, data2024 }
}

export const getChartOptions = (chartData: ReturnType<typeof getChartData>) => {
  const { series, orderNos } = chartData
  return {
    title: { text: '各志愿组近三年录取等位分对比', left: 'center', top: 0 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: series.map(s => s.name), top: 30 },
    grid: { containLabel: true, left: 60, right: 20, top: 80, bottom: 30 },
    xAxis: { type: 'category', data: orderNos.map(n => `志愿${n}`), name: '志愿顺序', axisLabel: { rotate: 0 } },
    yAxis: { type: 'value', name: '预估最低分（分）' },
    series: series.map(s => ({
      name: s.name,
      type: s.type,
      data: s.data,
      lineStyle: s.lineStyle,
      symbol: s.symbol,
      symbolSize: s.symbolSize,
      itemStyle: s.itemStyle,
      connectNulls: s.connectNulls,
      smooth: s.smooth,
    })),
    animation: false,
  }
}

export const generateHtmlReport = (plan: RichVolunteerPlan, examInfo?: ExamInfo, chartImage?: string): string => {
  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  const safe = (value: unknown, defaultValue = '无'): string => {
    if (value === undefined || value === null) return defaultValue
    const str = String(value)
    return str === '' ? defaultValue : str
  }

  const stats = plan.planStatistics || {
    totalUniversities: 0,
    totalGroups: 0,
    totalMajors: 0,
    majorDistribution: {},
  }

  const { hasAnyTrendData, series, orderNos, sortedGroups, hasData2024, data2024 } = getChartData(plan)
  const isPdfExport = !!chartImage

  const defaultExamInfo: ExamInfo = {
    name: safe(plan.userDetails?.username, '考生'),
    examNumber: '暂未填写',
    score: 0,
    rank: 0,
    province: safe(plan.detailedGroups?.[0]?.universityDetails?.region, '黑龙江省'),
    category: '物理',
  }
  const info = examInfo || defaultExamInfo
  const planCreatedAt = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : ''

  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>${safe(plan.name)} - 志愿方案详情</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            :root { --pri: #1B4332; --pri-light: #2D6A4F; --acc: #D4A843; --cream: #FFFBF5; --ink: #1A1A2E; --warm: #F5F0E8; }
            body { font-family: 'Noto Sans SC', sans-serif; background: var(--cream); color: var(--ink); line-height: 1.6; margin: 0; padding: 20px; }
            .container { max-width: 1000px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
            h1, h2, h3, h4 { color: var(--pri); font-family: 'Noto Serif SC', serif; margin-top: 25px; margin-bottom: 15px; }
            h1 { font-size: 28px; text-align: center; font-weight: 900; }
            h2 { font-size: 22px; font-weight: 700; border-left: 4px solid var(--acc); padding-left: 12px; }
            h3 { font-size: 18px; font-weight: 600; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            h4 { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; }
            p { margin-bottom: 8px; }
            .text-center { text-align: center; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .text-gray-600 { color: #4B5563; }
            .text-gray-400 { color: #9CA3AF; }
            .font-bold { font-weight: 700; }
            .rounded-full { border-radius: 9999px; }
            .px-4 { padding-left: 16px; padding-right: 16px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-4 { margin-top: 16px; }
            .mt-2 { margin-top: 8px; }
            .bg-pri { background-color: var(--pri); }
            .text-white { color: white; }
            .report-section { margin-bottom: 28px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
            .report-section:last-of-type { border-bottom: none; padding-bottom: 0; }
            .user-card { background: linear-gradient(135deg, var(--pri) 0%, var(--pri-light) 100%); color: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; flex-wrap: wrap; gap: 24px; }
            .user-card-item { flex: 1; min-width: 140px; }
            .user-card-item .label { font-size: 13px; opacity: 0.8; margin-bottom: 4px; }
            .user-card-item .value { font-size: 20px; font-weight: 700; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .stat-item { background-color: var(--warm); padding: 15px; border-radius: 6px; border: 1px solid #E5E7EB; }
            .stat-item strong { color: var(--pri); display: block; margin-bottom: 5px; }
            .major-distribution-item { display: inline-block; background-color: #E0F2F7; color: #007B8A; padding: 5px 10px; border-radius: 4px; margin-right: 8px; margin-bottom: 8px; font-size: 0.9em; border: 1px solid #B2EBF2; }
            .score-trend-item { background-color: #FFF3E0; padding: 10px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #FFCC80; }
            .report-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
            .report-table th, .report-table td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; vertical-align: top; }
            .report-table th { background-color: var(--pri); color: white; font-weight: 500; }
            .report-table tbody tr:nth-child(even) { background-color: #F9FAFB; }
            .report-table tbody tr:hover { background-color: #F0F7F4; }
            .detail-box { background-color: #F8FAFC; border: 1px solid #E9EEF6; border-radius: 6px; padding: 15px; margin-bottom: 20px; }
            .detail-box h4 { margin-top: 0; margin-bottom: 10px; color: var(--acc); }
            .detail-box p { margin-bottom: 5px; font-size: 14px; }
            .major-detail-item { background-color: #fff; border: 1px solid #D9E2EC; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
            .major-detail-item strong { color: var(--pri); }
            .chart-container { width: 100%; height: 400px; margin: 20px 0; background: #fff; border-radius: 8px; padding: 10px; border: 1px solid #eee; }
            @media (max-width: 768px) {
                .container { padding: 20px; }
                .user-card { flex-direction: column; gap: 12px; }
                .report-table th, .report-table td { padding: 6px; }
                .stats-grid { grid-template-columns: 1fr; }
                .chart-container { height: 300px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- 页眉 -->
            <div class="text-center mb-4" style="border-bottom: 2px solid rgba(27,67,50,0.1); padding-bottom: 20px;">
                <div class="inline-block bg-pri text-white px-4 py-1 rounded-full text-xs font-medium mb-4">高考志愿填报报告</div>
                <h1>${safe(plan.name)} - 志愿方案详情</h1>
                <p class="text-gray-400 text-sm">生成日期: ${dateStr}</p>
            </div>
            <!-- 用户简况卡 -->
            <div class="user-card">
                <div class="user-card-item"><div class="label">考生姓名</div><div class="value">${safe(info.name)}</div></div>
                <div class="user-card-item"><div class="label">准考证号</div><div class="value">${safe(info.examNumber, '未填写')}</div></div>
                <div class="user-card-item"><div class="label">高考总分</div><div class="value">${info.score > 0 ? info.score + ' 分' : '未填写'}</div></div>
                <div class="user-card-item"><div class="label">全省排名</div><div class="value">${info.rank > 0 ? info.rank : '未填写'}</div></div>
                <div class="user-card-item"><div class="label">选科类别</div><div class="value">${safe(info.category)}</div></div>
                <div class="user-card-item"><div class="label">所在省份</div><div class="value">${safe(info.province)}</div></div>
            </div>
            <!-- 方案概览 -->
            <div class="report-section">
                <h2>一、方案概览</h2>
                <p><strong>方案名称:</strong> ${safe(plan.name)}</p>
                <p><strong>方案备注:</strong> ${safe(plan.description, '无')}</p>
                <p><strong>创建日期:</strong> ${planCreatedAt || '未记录'}</p>
            </div>
            <!-- 统计数据 -->
            <div class="report-section">
                <h2>二、统计数据</h2>
                <div class="stats-grid">
                    <div class="stat-item"><strong>📊 志愿组总数</strong><br>${stats.totalGroups || 0}</div>
                    <div class="stat-item"><strong>📚 专业总数</strong><br>${stats.totalMajors || 0}</div>
                    <div class="stat-item"><strong>🏫 院校总数</strong><br>${stats.totalUniversities || 0}</div>
                    <div class="stat-item"><strong>📈 预估平均分</strong><br>${
                      hasData2024 ? (data2024.filter(v => v !== null).reduce((a,b)=>a+b,0)/data2024.filter(v=>v!==null).length).toFixed(0) : '暂无'
                    }</div>
                </div>
                <h3>📊 专业分布</h3>
                <div>
                    ${Object.keys(stats.majorDistribution || {}).length > 0
                        ? Object.entries(stats.majorDistribution).map(([name, cnt]) => `<span class="major-distribution-item">${name} (${cnt})</span>`).join('')
                        : '<p class="text-gray-600">暂无专业分布数据</p>'}
                </div>
            </div>
            <!-- 三、志愿分数趋势（三年对比） -->
            <div class="report-section">
                <h2>三、志愿分数趋势（近三年等位分对比）</h2>
                ${hasAnyTrendData ? `
                <div class="text-sm text-gray-600 mb-2">说明：折线图中缺失的点表示该专业组当年无录取分数数据。本图基于等位换算最低分，仅供参考。</div>
                ${isPdfExport && chartImage ? `
                    <div class="chart-container" style="display: flex; justify-content: center; align-items: center; height: auto; min-height: 400px;">
                        <img src="${chartImage}" style="max-width: 100%; height: auto;" />
                    </div>
                ` : `
                    <div id="scoreChart" class="chart-container"></div>
                    <script>
                        window.addEventListener('load', function() {
                            var chartDom = document.getElementById('scoreChart');
                            var myChart = echarts.init(chartDom);
                            var option = {
                                title: { text: '各志愿组近三年录取等位分对比', left: 'center', top: 0 },
                                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                                legend: { data: ${JSON.stringify(series.map(s => s.name))}, top: 30 },
                                grid: { containLabel: true, left: 60, right: 20, top: 80, bottom: 30 },
                                xAxis: { type: 'category', data: ${JSON.stringify(orderNos.map(n => `志愿${n}`))}, name: '志愿顺序', axisLabel: { rotate: 0 } },
                                yAxis: { type: 'value', name: '预估最低分（分）' },
                                series: ${JSON.stringify(series.map(s => ({
                                    name: s.name,
                                    type: s.type,
                                    data: s.data,
                                    lineStyle: s.lineStyle,
                                    symbol: s.symbol,
                                    symbolSize: s.symbolSize,
                                    itemStyle: s.itemStyle,
                                    connectNulls: s.connectNulls,
                                    smooth: s.smooth,
                                })))}
                            };
                            myChart.setOption(option);
                            window.addEventListener('resize', function() { myChart.resize(); });
                        });
                    </script>
                `}
                ` : '<p class="text-gray-600">暂无近三年录取分数数据，无法绘制趋势图。</p>'}
            </div>
            <!-- 四、志愿明细表 -->
            <div class="report-section">
                <h2>四、志愿明细表</h2>
                <div style="overflow-x: auto;">
                    <table class="report-table">
                        <thead><tr><th>志愿顺序</th><th>院校代码</th><th>院校名称</th><th>专业组代号</th><th>专业组名称</th><th>专业志愿顺序</th><th>专业代码</th><th>专业名称</th><th>是否服从调剂</th><th>备注</th></tr></thead>
                        <tbody>
                            ${sortedGroups.length > 0
                                ? sortedGroups.flatMap(group => {
                                    const majors = group.detailedMajors && group.detailedMajors.length > 0 ? group.detailedMajors : [{ majorOrder: 1, majorCode: '', majorName: '(未填报)' }]
                                    return majors.map((major, idx) => `
                                        <tr>
                                            ${idx === 0 ? `<td rowspan="${majors.length}">${group.orderNo}</td>
                                            <td rowspan="${majors.length}">${safe(group.universityCode)}</td>
                                            <td rowspan="${majors.length}">${safe(group.universityName)}</td>
                                            <td rowspan="${majors.length}">${safe(group.groupCode)}</td>
                                            <td rowspan="${majors.length}">${safe(group.groupName)}</td>` : ''}
                                            <td>${safe(major.majorOrder)}</td>
                                            <td>${safe(major.majorCode)}</td>
                                            <td>${safe(major.majorName)}</td>
                                            ${idx === 0 ? `<td rowspan="${majors.length}">${group.isObeyAdjustment ? '服从' : '不服从'}</td>
                                            <td rowspan="${majors.length}">${safe(group.remark, '无')}</td>` : ''}
                                        </tr>
                                    `).join('')
                                }).join('')
                                : '<tr><td colspan="10" class="text-center">暂无志愿数据</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            <!-- 五、专业详情 -->
            <div class="report-section">
                <h2>五、专业详情</h2>
                ${sortedGroups.length > 0
                    ? sortedGroups.map(group => `
                        <div class="detail-box">
                            <h4>${group.orderNo}. ${safe(group.universityName)} - ${safe(group.groupName)}</h4>
                            ${group.detailedMajors && group.detailedMajors.length > 0
                                ? group.detailedMajors.map(major => `
                                    <div class="major-detail-item">
                                        <p><strong>${major.majorOrder}. ${safe(major.majorName)}</strong> (${safe(major.majorCode)})</p>
                                        <p><strong>最低分/位次:</strong> ${major.minScore ?? '-'} / ${major.minRank ?? '-'}</p>
                                        <p><strong>学费:</strong> ${major.tuition ? `${major.tuition}元/年` : '-'}</p>
                                        <p><strong>专业简介:</strong> ${safe(major.majorIntro)}</p>
                                        <p><strong>培养目标:</strong> ${safe(major.trainingGoal)}</p>
                                        <p><strong>就业方向:</strong> ${safe(major.employmentDirection)}</p>
                                    </div>
                                `).join('')
                                : '<p>暂无详细专业信息</p>'
                            }
                        </div>
                    `).join('')
                    : '<p>暂无详细志愿组信息</p>'
                }
            </div>
            <!-- 六、免责声明 -->
            <div class="report-section" style="border-bottom: none; padding-bottom: 0;">
                <h2>六、免责声明</h2>
                <p class="text-xs text-gray-400 leading-relaxed">
                    <strong>免责声明：</strong>本报告由高考志愿规划系统生成，所有院校录取分数线均为算法估算，不构成实际录取承诺。考生和家长应结合官方发布的招生计划、历年录取数据及当年政策进行综合判断。本系统不对因使用本报告而导致的任何录取结果承担责任。
                </p>
                <p class="text-xs text-gray-400 mt-2">* 本报告仅供内部参考，未经授权不得外传。</p>
                <p class="text-xs text-gray-400 mt-2">生成工具：高考志愿规划系统</p>
            </div>
        </div>
    </body>
    </html>
  `
  return html
}
