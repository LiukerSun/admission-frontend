// Central label mapping for every enum field the backend / AI agent uses.
//
// UI components MUST render `label` (+ `hint` when present) and never the
// raw `code`. The codes only travel over the wire — to the backend, then
// into the AI agent's `recommendation_request` block.

export interface CodedOption<T extends string = string> {
  code: T
  label: string
  hint?: string
}

export interface RegionOption extends CodedOption {
  // supported=false means the row is kept in the data layer (user can still
  // pick / save it) but the AI agent will not currently produce a useful
  // result; the UI marks it as 即将开放 / coming-soon.
  supported: boolean
}

export const REGION_OPTIONS: RegionOption[] = [
  { code: '230000', label: '黑龙江省', supported: true },
  // 未来扩展的占位：默认隐藏，等 agent 支持后改 supported=true 并取消注释。
  // { code: '110000', label: '北京市',     supported: false },
  // { code: '440000', label: '广东省',     supported: false },
  // { code: '320000', label: '江苏省',     supported: false },
]

export type SubjectCategoryCode = 'physics' | 'history'

export const SUBJECT_CATEGORY_OPTIONS: CodedOption<SubjectCategoryCode>[] = [
  {
    code: 'physics',
    label: '物理类',
    hint: '理工方向，可填报物理类专业组',
  },
  {
    code: 'history',
    label: '历史类',
    hint: '文史方向，可填报历史类专业组',
  },
]

export type ElectiveSubjectCode = 'biology' | 'chemistry' | 'geography' | 'politics'

// 4 选 2 再选科目字典。后端 user_profiles.elective_subjects CHECK 约束与此严格一致；
// 顺序按"理科 → 文科"排，UI 上 Checkbox.Group 也按这个顺序展示。
export const ELECTIVE_SUBJECT_OPTIONS: CodedOption<ElectiveSubjectCode>[] = [
  { code: 'biology', label: '生物' },
  { code: 'chemistry', label: '化学' },
  { code: 'geography', label: '地理' },
  { code: 'politics', label: '政治' },
]

export function labelForElectiveSubject(code?: string | null): string {
  if (!code) return ''
  return ELECTIVE_SUBJECT_OPTIONS.find((o) => o.code === code)?.label ?? code
}

export function labelForRegion(code?: string | null): string {
  if (!code) return ''
  return REGION_OPTIONS.find((o) => o.code === code)?.label ?? code
}

export function labelForSubject(code?: string | null): string {
  if (!code) return ''
  return SUBJECT_CATEGORY_OPTIONS.find((o) => o.code === code)?.label ?? code
}
