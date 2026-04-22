import { describe, expect, it } from 'vitest'
import { isMainlandPhone, normalizeMainlandPhone } from './phone'

describe('phone utils', () => {
  it('normalizes common mainland phone formats', () => {
    expect(normalizeMainlandPhone(' 138 0013 8000 ')).toBe('13800138000')
    expect(normalizeMainlandPhone('+86 138-0013-8000')).toBe('13800138000')
    expect(normalizeMainlandPhone('86(138)00138000')).toBe('13800138000')
  })

  it('validates normalized mainland phone numbers', () => {
    expect(isMainlandPhone('+86 138-0013-8000')).toBe(true)
    expect(isMainlandPhone('12800138000')).toBe(false)
    expect(isMainlandPhone('1380013800')).toBe(false)
  })
})
