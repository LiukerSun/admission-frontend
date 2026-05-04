import { describe, expect, it } from 'vitest'
import { getAccountCenterRedirect, getAccountCenterTab, isAccountCenterTab } from './accountCenter'

describe('account center routing', () => {
  it('redirects legacy account routes to the matching account center tab', () => {
    expect(getAccountCenterRedirect('/membership')).toBe('/profile?tab=membership-orders')
    expect(getAccountCenterRedirect('/orders')).toBe('/profile?tab=membership-orders')
    expect(getAccountCenterRedirect('/bindings')).toBe('/profile?tab=family-bindings')
  })

  it('recognizes supported account center tabs', () => {
    expect(isAccountCenterTab('profile-security')).toBe(true)
    expect(isAccountCenterTab('family-bindings')).toBe(true)
    expect(isAccountCenterTab('membership-orders')).toBe(true)
    expect(isAccountCenterTab('unknown')).toBe(false)
  })

  it('falls back to profile security when the query tab is missing or invalid', () => {
    expect(getAccountCenterTab(null)).toBe('profile-security')
    expect(getAccountCenterTab('unknown')).toBe('profile-security')
    expect(getAccountCenterTab('family-bindings')).toBe('family-bindings')
  })
})
