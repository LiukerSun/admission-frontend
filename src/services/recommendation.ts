import api from './api'

// 后端 admission.RecommendationRequest 的镜像（只放 MVP 表单会用到的字段）。
export interface RecommendationRequest {
  region_code: string
  subject_category_code: 'physics' | 'history'
  subject_requirement_code?: string
  selected_subjects?: string[]
  total_score: number
  provincial_rank: number
  admission_year?: number

  math_score?: number
  physics_score?: number
  chinese_score?: number
  english_score?: number

  preferred_majors?: string[]
  excluded_majors?: string[]
  excluded_keywords?: string[]

  preferred_cities?: string[]
  excluded_cities?: string[]

  family_resources?: string[]
  family_economy?: string

  priority_strategy?: 'auto' | 'school' | 'major'
  budget_tuition_max?: number
  plan_size?: number
  enable_llm_tuning?: boolean
}

export interface ScoreBreakdown {
  city_score: number
  school_score: number
  major_score: number
  ability_improvement_score: number
  future_competitiveness_score: number
  city_reason?: string
  school_reason?: string
  major_reason?: string
  ability_improvement_reason?: string
  future_competitiveness_reason?: string
  evaluated_by?: string
}

export interface RecommendationItem {
  order: number
  tier: 'rush' | 'match' | 'safe'
  probability: number
  composite_score: number
  reason: string
  score_breakdown: ScoreBreakdown
  university_id: number
  university_code: string
  university_name: string
  city?: string
  is_985: boolean
  is_211: boolean
  is_double_first_class: boolean
  group_code: string
  batch_code: string
  local_major_code: string
  local_major_name: string
  discipline_category?: string
  historical_min_score?: number
  historical_min_rank?: number
  plan_count?: number
  tuition?: number
  warnings?: string[]
}

export interface RankWindow {
  rush_min: number
  rush_max: number
  match_min: number
  match_max: number
  safe_min: number
  safe_max: number
}

export interface RecommendationResponse {
  strategy: 'school' | 'major'
  strategy_reason: string
  items: RecommendationItem[]
  rush_count: number
  match_count: number
  safe_count: number
  rank_window: RankWindow
  notes?: string[]
  llm_summary?: string
}

type Envelope<T> = { code: number; message?: string; data?: T }

export const recommendationApi = {
  recommend: (req: RecommendationRequest) =>
    api.post<Envelope<RecommendationResponse>>('/api/v1/admission/recommendations', req),
}
