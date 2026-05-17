import { create } from 'zustand'
import {
  userProfileApi,
  type UpsertProfileRequest,
  type UserProfile,
} from '@/services/userProfile'

// 极简版完整度：只看「必填基本信息」4 项 ——
//   region / subject / electives(4选2) / total_score
// 其余可选字段（preferences / 单科分 / strategy 等）虽仍存在 DB 上以兼容老数据，
// 但用户在 profile-survey 里不再填，因此不计入完整度。dashboard 进度条和 hero
// 卡片读取这个计数，保持口径一致：填完这 4 项 = 100%。
const FILLABLE_FIELD_COUNT = 4

function countFilled(profile: UserProfile | null): number {
  if (!profile) return 0
  let n = 0
  const scalars: Array<keyof UpsertProfileRequest> = [
    'region_code',
    'subject_category_code',
    'total_score',
  ]
  for (const key of scalars) {
    const v = (profile as unknown as Record<string, unknown>)[key]
    if (typeof v === 'number') {
      n += 1
    } else if (typeof v === 'string' && v.trim() !== '') {
      n += 1
    }
  }
  // 再选科目：长度=2 算 1 个 slot；少于 2 不算（与后端 markCompleted 一致）
  if (Array.isArray(profile.elective_subjects) && profile.elective_subjects.length === 2) {
    n += 1
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
