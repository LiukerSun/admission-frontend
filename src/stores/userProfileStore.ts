import { create } from 'zustand'
import {
  userProfileApi,
  type UpsertProfileRequest,
  type UserProfile,
} from '@/services/userProfile'

// Counts every "concrete" answer the user supplied across the 21 logical
// slots the questionnaire surfaces:
//   10 scalars (region/subject/total/rank/plan_size/strategy/4 单科)
// +  8 array preferences (required/preferred/excluded majors+keywords +
//      preferred/excluded cities+provinces)
// +  1 holland code
// +  1 family/career bundle (any of family_resources, family_economy,
//      career_plans non-empty counts once — they describe context the AI
//      rarely needs all three of)
// +  1 budget_tuition_max
// = 21
// Used by the dashboard progress bar and the hero card.
const FILLABLE_FIELD_COUNT = 21

function countFilled(profile: UserProfile | null): number {
  if (!profile) return 0
  let n = 0
  const scalars: Array<keyof UpsertProfileRequest> = [
    'region_code',
    'subject_category_code',
    'total_score',
    'provincial_rank',
    'plan_size',
    'priority_strategy',
    'math_score',
    'physics_score',
    'chinese_score',
    'english_score',
  ]
  for (const key of scalars) {
    const v = (profile as unknown as Record<string, unknown>)[key]
    if (typeof v === 'number') {
      n += 1
    } else if (typeof v === 'string' && v.trim() !== '') {
      n += 1
    }
  }
  const prefs = profile.preferences
  if (prefs) {
    const arrayFields = [
      prefs.required_majors,
      prefs.preferred_majors,
      prefs.excluded_majors,
      prefs.excluded_keywords,
      prefs.preferred_cities,
      prefs.excluded_cities,
      prefs.preferred_provinces,
      prefs.excluded_provinces,
    ]
    for (const arr of arrayFields) {
      if (arr && arr.length > 0) n += 1
    }
    if (prefs.holland_code && prefs.holland_code.trim() !== '') n += 1
    // family_resources / family_economy / career_plans collectively count
    // as one slot — they describe context the AI rarely needs all three of.
    if (
      (prefs.family_resources && prefs.family_resources.trim() !== '') ||
      (prefs.family_economy && prefs.family_economy.trim() !== '') ||
      (prefs.career_plans && prefs.career_plans.trim() !== '')
    ) {
      n += 1
    }
    if (typeof prefs.budget_tuition_max === 'number') {
      n += 1
    }
  }
  return Math.min(n, FILLABLE_FIELD_COUNT)
}

interface UserProfileState {
  profile: UserProfile | null
  // hasCompletedProfile mirrors backend `completed` (4 required scalars filled).
  hasCompletedProfile: boolean
  filledCount: number
  totalCount: number
  loading: boolean
  loaded: boolean
  error: string | null

  loadProfile: () => Promise<UserProfile | null>
  updateProfile: (patch: UpsertProfileRequest) => Promise<UserProfile>
  clear: () => void
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  hasCompletedProfile: false,
  filledCount: 0,
  totalCount: FILLABLE_FIELD_COUNT,
  loading: false,
  loaded: false,
  error: null,

  loadProfile: async () => {
    // Don't refetch if a load is already in flight; callers can rely on the
    // existing promise resolving via the loading flag instead.
    if (get().loading) return get().profile
    set({ loading: true, error: null })
    try {
      const res = await userProfileApi.get()
      const profile = res.data.data ?? null
      set({
        profile,
        hasCompletedProfile: Boolean(profile?.completed),
        filledCount: countFilled(profile),
        loaded: true,
        loading: false,
      })
      return profile
    } catch (err) {
      set({
        loading: false,
        loaded: true,
        error: err instanceof Error ? err.message : '加载档案失败',
      })
      return null
    }
  },

  updateProfile: async (patch) => {
    set({ loading: true, error: null })
    try {
      const res = await userProfileApi.update(patch)
      const profile = res.data.data
      set({
        profile,
        hasCompletedProfile: Boolean(profile.completed),
        filledCount: countFilled(profile),
        loaded: true,
        loading: false,
      })
      return profile
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : '保存档案失败',
      })
      throw err
    }
  },

  clear: () => {
    set({
      profile: null,
      hasCompletedProfile: false,
      filledCount: 0,
      loaded: false,
      error: null,
    })
  },
}))
