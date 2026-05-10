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

  listUniversities: (params: { q?: string }) =>
    api.get<AdmissionEnvelope<University[]>>('/api/v1/admission/universities', {
      params: cleanParams(params),
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
}
