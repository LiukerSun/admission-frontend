import { describe, expect, it } from 'vitest'
import {
  buildRecommendationRequestBlock,
  buildRecommendationRequestPayload,
  formatRecommendationRequestBlock,
  prependRecommendationRequest,
} from './recommendationRequest'
import type { RecommendationSnapshot, UserProfile } from '@/services/userProfile'

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    user_id: 1,
    completed: false,
    region_code: '230000',
    subject_category_code: 'physics',
    elective_subjects: ['biology', 'chemistry'],
    total_score: 620,
    ...overrides,
  } as UserProfile
}

function makeSnapshot(overrides: Partial<RecommendationSnapshot> = {}): RecommendationSnapshot {
  return {
    region_code: '230000',
    subject_category_code: 'physics',
    elective_subjects: ['biology', 'chemistry'],
    total_score: 620,
    provincial_rank: 3304,
    plan_size: 40,
    year_used: 2025,
    rank_source: 'exact',
    ...overrides,
  } as RecommendationSnapshot
}

describe('buildRecommendationRequestPayload', () => {
  it('snapshot 路径：返回 6 个核心字段', () => {
    const payload = buildRecommendationRequestPayload(makeProfile(), makeSnapshot())
    expect(payload).toEqual({
      region_code: '230000',
      subject_category_code: 'physics',
      total_score: 620,
      provincial_rank: 3304,
      plan_size: 40,
      elective_subjects: ['biology', 'chemistry'],
    })
  })

  it('snapshot 路径：snapshot 字段优先于 profile', () => {
    // profile 上 region 是 110000，snapshot 上是 230000 → 应取 snapshot 的
    const profile = makeProfile({ region_code: '110000' })
    const snapshot = makeSnapshot({ region_code: '230000' })
    const payload = buildRecommendationRequestPayload(profile, snapshot)
    expect(payload!.region_code).toBe('230000')
  })

  it('snapshot 失败 + profile 4 项齐全 → 回退到 profile 路径', () => {
    const payload = buildRecommendationRequestPayload(makeProfile(), null)
    expect(payload).toEqual({
      region_code: '230000',
      subject_category_code: 'physics',
      total_score: 620,
      elective_subjects: ['biology', 'chemistry'],
    })
  })

  it('snapshot 失败 + profile 缺关键字段 → null', () => {
    expect(buildRecommendationRequestPayload(null, null)).toBeNull()
    expect(
      buildRecommendationRequestPayload(makeProfile({ total_score: undefined }), null),
    ).toBeNull()
    expect(
      buildRecommendationRequestPayload(makeProfile({ elective_subjects: undefined }), null),
    ).toBeNull()
  })

  it('snapshot rank=0 视为不可用 → 回退 profile', () => {
    const snapshot = makeSnapshot({ provincial_rank: 0 })
    const payload = buildRecommendationRequestPayload(makeProfile(), snapshot)
    // 回退路径不带 provincial_rank/plan_size
    expect(payload).toEqual({
      region_code: '230000',
      subject_category_code: 'physics',
      total_score: 620,
      elective_subjects: ['biology', 'chemistry'],
    })
  })
})

describe('formatRecommendationRequestBlock', () => {
  it('wraps the JSON in a fenced recommendation_request block', () => {
    const out = formatRecommendationRequestBlock({ foo: 'bar' })
    expect(out.startsWith('```recommendation_request\n')).toBe(true)
    expect(out.endsWith('\n```')).toBe(true)
    expect(out).toContain('"foo": "bar"')
  })
})

describe('buildRecommendationRequestBlock', () => {
  it('returns null when payload cannot be built', () => {
    expect(buildRecommendationRequestBlock(null)).toBeNull()
  })

  it('returns a fenced block when payload exists (snapshot path)', () => {
    const block = buildRecommendationRequestBlock(makeProfile(), makeSnapshot())
    expect(block).toMatch(/^```recommendation_request\n[\s\S]+\n```$/)
    const inner = block!.replace(/^```recommendation_request\n/, '').replace(/\n```$/, '')
    expect(() => JSON.parse(inner)).not.toThrow()
  })
})

describe('prependRecommendationRequest', () => {
  it('returns the original message when no required fields', () => {
    expect(prependRecommendationRequest('你好', null)).toBe('你好')
    expect(prependRecommendationRequest('你好', makeProfile({ total_score: undefined }))).toBe(
      '你好',
    )
  })

  it('prepends the block to the message with a blank-line separator', () => {
    const result = prependRecommendationRequest('你好', makeProfile(), makeSnapshot())
    expect(result.startsWith('```recommendation_request\n')).toBe(true)
    expect(result.endsWith('\n\n你好')).toBe(true)
  })
})
