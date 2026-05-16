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

export type PriorityStrategyCode = 'auto' | 'school' | 'major'

export const PRIORITY_STRATEGY_OPTIONS: CodedOption<PriorityStrategyCode>[] = [
  { code: 'auto', label: '让 AI 自动决定', hint: '综合冲稳保平衡（推荐）' },
  { code: 'school', label: '优先好院校', hint: '相同分段内，名校排前' },
  { code: 'major', label: '优先好专业', hint: '相同分段内，强势专业排前' },
]

export type HollandLetter = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export const HOLLAND_OPTIONS: CodedOption<HollandLetter>[] = [
  { code: 'R', label: '现实型 (R)', hint: '动手实操、机械、工程' },
  { code: 'I', label: '研究型 (I)', hint: '钻研、分析、科学' },
  { code: 'A', label: '艺术型 (A)', hint: '创意、设计、表达' },
  { code: 'S', label: '社会型 (S)', hint: '助人、教育、服务' },
  { code: 'E', label: '企业型 (E)', hint: '管理、销售、领导' },
  { code: 'C', label: '常规型 (C)', hint: '组织、数据、流程' },
]

export function labelForRegion(code?: string | null): string {
  if (!code) return ''
  return REGION_OPTIONS.find((o) => o.code === code)?.label ?? code
}

export function labelForSubject(code?: string | null): string {
  if (!code) return ''
  return SUBJECT_CATEGORY_OPTIONS.find((o) => o.code === code)?.label ?? code
}

export function labelForStrategy(code?: string | null): string {
  if (!code) return ''
  return PRIORITY_STRATEGY_OPTIONS.find((o) => o.code === code)?.label ?? code
}

// Holland code is a concatenation of single letters, e.g. "RIA". This
// utility splits and joins labels for display.
export function decomposeHollandCode(code?: string | null): HollandLetter[] {
  if (!code) return []
  const seen = new Set<HollandLetter>()
  const out: HollandLetter[] = []
  for (const ch of code.toUpperCase()) {
    if (ch === 'R' || ch === 'I' || ch === 'A' || ch === 'S' || ch === 'E' || ch === 'C') {
      if (!seen.has(ch)) {
        seen.add(ch)
        out.push(ch)
      }
    }
  }
  return out
}

export function composeHollandCode(letters: HollandLetter[]): string {
  return letters.join('')
}
