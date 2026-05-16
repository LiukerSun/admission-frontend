import api from './api'
import type { components, paths } from '@/types/api'

export type DictionaryResponse = components['schemas']['admission.DictionaryResponse']
export type DictionaryItem = components['schemas']['admission.DictionaryItem']
type AdmissionLineExtras = {
  batch_remark?: string
  group_min_score?: number
  group_min_rank?: number
  group_major_names?: string
  equivalent_min_score_2024?: number
  equivalent_min_score_2023?: number
  equivalent_min_score_2022?: number
  subject_change_2024?: string
  major_intro?: string
  training_goal?: string
  subject_study_requirement?: string
  main_courses?: string
  postgraduate_direction?: string
  employment_direction?: string
  discipline_category?: string
  first_level_discipline?: string
  fourth_round_subject_eval?: string
  double_first_class_subject?: string
  soft_major_grade?: string
  major_evaluation_score?: number
  major_rank?: string
  is_national_feature?: boolean
  corresponding_master_majors?: string
  corresponding_doctoral_majors?: string
  master_major_count?: number
  master_major_names?: string
  doctoral_major_count?: number
  doctoral_major_names?: string
}
export type AdmissionLine = components['schemas']['admission.AdmissionLineResponse'] & AdmissionLineExtras
export type StandardMajor = components['schemas']['admission.StandardMajorResponse']
export type University = components['schemas']['admission.UniversityResponse']
export type UniversityProfile = components['schemas']['admission.UniversityProfileResponse']

export interface VolunteerPlanMajor {
  majorOrder: number
  majorCode: string
  majorName: string
}

export interface VolunteerPlanGroup {
  id: string
  orderNo: number
  universityCode: string
  universityName: string
  groupCode: string
  groupName: string
  isObeyAdjustment: boolean
  remark: string
  majors: VolunteerPlanMajor[]
}

// Optional analytics-extension fields that the frontend uses for chart
// rendering (tuition, 985/211 tier). The backend response can include them,
// but they are not part of the auto-generated swagger schema for these
// types — declare them here so DataCharts.tsx can read them with safe
// optional access without us having to ship a divergent api.ts patch.
type AnalysisItemExtras = {
  tuition?: number
  is_985?: boolean
  is_211?: boolean
}

export type TrendResponse = components['schemas']['analysis.TrendResponse']
export type TrendYear = components['schemas']['analysis.TrendYear']
export type GroupComparisonResponse = components['schemas']['analysis.GroupComparisonResponse']
export type GroupComparisonItem = components['schemas']['analysis.GroupComparisonItem'] & AnalysisItemExtras
export type MajorDistributionResponse = components['schemas']['analysis.MajorDistributionResponse']
export type MajorDistributionItem = components['schemas']['analysis.MajorDistributionItem'] & AnalysisItemExtras
export type MajorComparisonResponse = Omit<components['schemas']['analysis.MajorComparisonResponse'], 'items'> & {
  items?: MajorComparisonItem[]
}
export type MajorComparisonItem = components['schemas']['analysis.MajorComparisonItem'] & AnalysisItemExtras

export interface VolunteerPlan {
  id: string
  name: string
  description: string
  groups: VolunteerPlanGroup[]
  stats: {
    schoolCount: number
    groupCount: number
    recordCount: number
  }
}

export interface UserDetails {
  username: string
  email: string
}

export interface PlanStatistics {
  totalUniversities: number
  totalGroups: number
  totalMajors: number
  majorDistribution: Record<string, number> // e.g., { '计算机科学与技术': 10, '软件工程': 8 }
}

export interface UniversityDetails {
  is985: boolean
  is211: boolean
  schoolCategory: string
  region: string
}

export interface GroupAdmissionDetails {
  minScore2024: number
  minScore2023: number
  minScore2022: number
}

export interface DetailedVolunteerPlanMajor extends VolunteerPlanMajor {
  majorIntro: string
  trainingGoal: string
  employmentDirection: string
  minScore: number
  minRank: number
  tuition: number
}

export interface DetailedVolunteerPlanGroup extends VolunteerPlanGroup {
  universityDetails: UniversityDetails
  groupAdmissionDetails: GroupAdmissionDetails
  detailedMajors: DetailedVolunteerPlanMajor[]
}

export interface RichVolunteerPlan extends VolunteerPlan {
  userDetails: UserDetails
  planStatistics: PlanStatistics
  detailedGroups: DetailedVolunteerPlanGroup[]
  createdAt?: string
}

export interface VolunteerPlansResponse {
  plans: VolunteerPlan[]
}

export type AdmissionLineQuery =
  NonNullable<paths['/api/v1/admission/admission-lines']['get']['parameters']['query']>

export type UniversityListQuery = {
  q?: string
  region_codes?: string[]
  school_category_codes?: string[]
  ownership_type_codes?: string[]
  education_level_code?: string
  is_985?: boolean
  is_211?: boolean
  is_double_first_class?: boolean
  is_national_key?: boolean
  is_provincial_key?: boolean
  has_postgraduate_recommendation?: boolean
}

type AdmissionEnvelope<T> = {
  code: number
  message?: string
  data?: T
}

function cleanParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

function toUniversityQueryParams(input: UniversityListQuery): Record<string, string> {
  const result: Record<string, string> = {}
  if (input.q && input.q.trim()) result.q = input.q.trim()
  if (input.region_codes?.length) result.region_codes = input.region_codes.join(',')
  if (input.school_category_codes?.length) result.school_category_codes = input.school_category_codes.join(',')
  if (input.ownership_type_codes?.length) result.ownership_type_codes = input.ownership_type_codes.join(',')
  if (input.education_level_code) result.education_level_code = input.education_level_code
  const triBool: Record<string, boolean | undefined> = {
    is_985: input.is_985,
    is_211: input.is_211,
    is_double_first_class: input.is_double_first_class,
    is_national_key: input.is_national_key,
    is_provincial_key: input.is_provincial_key,
    has_postgraduate_recommendation: input.has_postgraduate_recommendation,
  }
  Object.entries(triBool).forEach(([key, value]) => {
    if (value === true) result[key] = '1'
    else if (value === false) result[key] = '0'
  })
  return result
}

export const admissionApi = {
  listDictionaries: () => api.get<AdmissionEnvelope<DictionaryResponse>>('/api/v1/admission/dictionaries'),

  listAdmissionLines: (params: AdmissionLineQuery = {}) =>
    api.get<AdmissionEnvelope<AdmissionLine[]>>('/api/v1/admission/admission-lines', {
      params: cleanParams(params),
    }),

  listStandardMajors: (params: { q?: string; catalog_year?: number }) =>
    api.get<AdmissionEnvelope<StandardMajor[]>>('/api/v1/admission/standard-majors', {
      params: cleanParams(params),
    }),

  listUniversities: (params: UniversityListQuery = {}) =>
    api.get<AdmissionEnvelope<University[]>>('/api/v1/admission/universities', {
      params: toUniversityQueryParams(params),
    }),

  getUniversityProfile: (id: number, params?: { profile_year?: number }) =>
    api.get<AdmissionEnvelope<UniversityProfile>>(`/api/v1/admission/universities/${id}/profile`, {
      params: cleanParams(params || {}),
    }),

  listVolunteerPlans: () =>
    api.get<AdmissionEnvelope<VolunteerPlansResponse>>('/api/v1/admission/volunteer-plans'),

  updateVolunteerPlan: (id: string | number, data: { name: string; description: string }) =>
    api.put<AdmissionEnvelope<void>>(`/api/v1/admission/volunteer-plans/${id}`, data),

  updateGroupRemark: (groupId: string | number, remark: string) =>
    api.put<AdmissionEnvelope<void>>(`/api/v1/admission/volunteer-plans/groups/${groupId}/remark`, {
      remark,
    }),

  getRichVolunteerPlan: (planId: string | number) =>
    api.get<AdmissionEnvelope<RichVolunteerPlan>>(`/api/v1/admission/volunteer-plans/${planId}/rich-details`),

  getTrend: (id: number, params?: { group_code?: string; local_major_code?: string; years?: number }) =>
    api.get<AdmissionEnvelope<TrendResponse>>(`/api/v1/analysis/universities/${id}/trend`, {
      params: cleanParams(params || {}),
    }),

  getGroupComparison: (id: number, params?: { admission_year?: number; region_code?: string; subject_category_code?: string }) =>
    api.get<AdmissionEnvelope<GroupComparisonResponse>>(`/api/v1/analysis/universities/${id}/groups`, {
      params: cleanParams(params || {}),
    }),

  getMajorDistribution: (id: number, params?: { group_code?: string; admission_year?: number; region_code?: string; subject_category_code?: string }) =>
    api.get<AdmissionEnvelope<MajorDistributionResponse>>(`/api/v1/analysis/universities/${id}/majors/distribution`, {
      params: cleanParams(params || {}),
    }),

  getMajorComparison: (params: { local_major_name: string; admission_year?: number; region_code?: string; subject_category_code?: string; limit?: number }) =>
    api.get<AdmissionEnvelope<MajorComparisonResponse>>('/api/v1/analysis/majors/comparison', {
      params: cleanParams(params),
    }),
}
