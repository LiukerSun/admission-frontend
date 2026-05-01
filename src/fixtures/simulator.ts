export type SimulatorProfile = {
  subject: string
  city: string
  totalScore?: number
  provinceRank?: number
  surpassPercent?: number
  safetyMargin?: number
}

export const SIMULATOR_STORAGE_KEY = 'simulator_profile'

export const DEFAULT_SIMULATOR_PROFILE: SimulatorProfile = { subject: '理科', city: '哈尔滨' }

export const SUBJECT_OPTIONS = [
  { value: '理科', label: '理科' },
  { value: '文科', label: '文科' },
  { value: '物理类', label: '物理类' },
  { value: '历史类', label: '历史类' },
]

export const CITY_OPTIONS = [
  { value: '哈尔滨', label: '哈尔滨' },
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '广州', label: '广州' },
  { value: '深圳', label: '深圳' },
]

