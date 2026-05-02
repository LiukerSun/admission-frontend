import api from '@/services/api'
 
export type EnrollmentPlan = {
  school_name?: string
  school_code?: string
  province?: string
  year?: number
  batch?: string
  major_name?: string
  min_score?: number
  max_score?: number
  plan_count?: number
}
 
export async function getEnrollmentPlans(params: {
  school_name?: string
  province?: string
  year?: number
  batch?: string
  page?: number
  per_page?: number
}): Promise<EnrollmentPlan[]> {
  const res = await api.get('/api/v1/analysis/enrollment-plans', { params })
  const list = (res.data?.data?.plans as EnrollmentPlan[] | undefined) || []
  return list
}
