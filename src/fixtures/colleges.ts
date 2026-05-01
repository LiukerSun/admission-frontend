import type { EnrollmentPlan } from '@/services/colleges'

export type PlanExt = EnrollmentPlan & {
  school_type?: string
  school_level?: string
}

export const SAMPLE_PLANS: PlanExt[] = [
  { school_name: '清华大学', province: '北京', year: 2025, batch: '本科一批', major_name: '计算机科学与技术', min_score: 690, max_score: 705, plan_count: 12, school_type: '理工', school_level: '985' },
  { school_name: '北京大学', province: '北京', year: 2025, batch: '本科一批', major_name: '经济学', min_score: 685, max_score: 702, plan_count: 10, school_type: '综合', school_level: '985' },
  { school_name: '复旦大学', province: '上海', year: 2025, batch: '本科一批', major_name: '临床医学', min_score: 670, max_score: 690, plan_count: 18, school_type: '综合', school_level: '985' },
  { school_name: '浙江大学', province: '浙江', year: 2025, batch: '本科一批', major_name: '软件工程', min_score: 665, max_score: 688, plan_count: 16, school_type: '理工', school_level: '985' },
  { school_name: '南京大学', province: '江苏', year: 2025, batch: '本科一批', major_name: '数学与应用数学', min_score: 660, max_score: 684, plan_count: 14, school_type: '综合', school_level: '985' },
  { school_name: '中山大学', province: '广东', year: 2025, batch: '本科一批', major_name: '法学', min_score: 645, max_score: 672, plan_count: 22, school_type: '综合', school_level: '211' },
  { school_name: '武汉大学', province: '湖北', year: 2025, batch: '本科一批', major_name: '新闻传播学', min_score: 640, max_score: 668, plan_count: 20, school_type: '综合', school_level: '211' },
  { school_name: '四川大学', province: '四川', year: 2025, batch: '本科一批', major_name: '口腔医学', min_score: 638, max_score: 666, plan_count: 12, school_type: '综合', school_level: '211' },
]

export const PROVINCE_OPTIONS = [
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '广东', label: '广东' },
  { value: '江苏', label: '江苏' },
  { value: '浙江', label: '浙江' },
  { value: '山东', label: '山东' },
  { value: '湖北', label: '湖北' },
  { value: '四川', label: '四川' },
]

export const SCHOOL_TYPE_OPTIONS = [
  { value: '综合', label: '综合' },
  { value: '理工', label: '理工' },
  { value: '师范', label: '师范' },
  { value: '财经', label: '财经' },
  { value: '医药', label: '医药' },
]

export const SCHOOL_LEVEL_OPTIONS = [
  { value: '985', label: '985' },
  { value: '211', label: '211' },
  { value: '双一流', label: '双一流' },
  { value: '普通本科', label: '普通本科' },
  { value: '专科', label: '专科' },
]

