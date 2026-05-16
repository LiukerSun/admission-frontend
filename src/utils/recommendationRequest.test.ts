import { describe, expect, it } from 'vitest'
import {
  buildRecommendationRequestBlock,
  buildRecommendationRequestPayload,
  formatRecommendationRequestBlock,
  prependRecommendationRequest,
} from './recommendationRequest'
import type { UserProfile } from '@/services/userProfile'

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    user_id: 1,
    completed: false,
    region_code: '230000',
    subject_category_code: 'physics',
    total_score: 620,
    provincial_rank: 4500,
    plan_size: 40,
    preferences: {},
    ...overrides,
  } as UserProfile
}

describe('buildRecommendationRequestPayload', () => {
  it('returns null when profile is null/undefined', () => {
    expect(buildRecommendationRequestPayload(null)).toBeNull()
    expect(buildRecommendationRequestPayload(undefined)).toBeNull()
  })

  it('returns null when any required scalar is missing', () => {
    expect(
      buildRecommendationRequestPayload(makeProfile({ total_score: undefined })),
    ).toBeNull()
    expect(
      buildRecommendationRequestPayload(makeProfile({ subject_category_code: '' })),
    ).toBeNull()
    expect(
      buildRecommendationRequestPayload(makeProfile({ provincial_rank: undefined })),
    ).toBeNull()
    expect(
      buildRecommendationRequestPayload(makeProfile({ region_code: '   ' })),
    ).toBeNull()
  })

  it('emits the 4 required scalars when present', () => {
    const payload = buildRecommendationRequestPayload(makeProfile())
    expect(payload).toMatchObject({
      region_code: '230000',
      subject_category_code: 'physics',
      total_score: 620,
      provincial_rank: 4500,
      plan_size: 40,
    })
  })

  it('omits empty arrays and empty strings from preferences', () => {
    const payload = buildRecommendationRequestPayload(
      makeProfile({
        preferences: {
          required_majors: [],
          preferred_majors: ['计算机'],
          family_resources: '',
          holland_code: 'RIA',
        },
      }),
    )
    expect(payload).toBeDefined()
    expect(payload!.required_majors).toBeUndefined()
    expect(payload!.family_resources).toBeUndefined()
    expect(payload!.preferred_majors).toEqual(['计算机'])
    expect(payload!.holland_code).toBe('RIA')
  })

  it('includes single-subject scores and budget when provided', () => {
    const payload = buildRecommendationRequestPayload(
      makeProfile({
        math_score: 135,
        english_score: 130,
        preferences: { budget_tuition_max: 30000 },
      }),
    )
    expect(payload).toMatchObject({
      math_score: 135,
      english_score: 130,
      budget_tuition_max: 30000,
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

  it('returns a fenced block when payload exists', () => {
    const block = buildRecommendationRequestBlock(makeProfile())
    expect(block).toMatch(/^```recommendation_request\n[\s\S]+\n```$/)
    // The block is valid JSON inside the fence.
    const inner = block!.replace(/^```recommendation_request\n/, '').replace(/\n```$/, '')
    expect(() => JSON.parse(inner)).not.toThrow()
  })
})

describe('prependRecommendationRequest', () => {
  it('returns the original message when no profile / required missing', () => {
    expect(prependRecommendationRequest('你好', null)).toBe('你好')
    expect(prependRecommendationRequest('你好', makeProfile({ total_score: undefined }))).toBe('你好')
  })

  it('prepends the block to the message with a blank-line separator', () => {
    const result = prependRecommendationRequest('你好', makeProfile())
    expect(result.startsWith('```recommendation_request\n')).toBe(true)
    expect(result.endsWith('\n\n你好')).toBe(true)
  })
})
