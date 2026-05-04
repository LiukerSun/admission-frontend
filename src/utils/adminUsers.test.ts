import { describe, expect, it } from 'vitest'
import { buildAdminUserUpdatePayload, canChangeAdminPermission } from './adminUsers'

describe('admin user editing', () => {
  it('sends membership level and admin permission independently', () => {
    const payload = buildAdminUserUpdatePayload(
      {
        id: 10,
        email: 'old@example.com',
        username: 'Old',
        role: 'user',
        is_admin: false,
        user_type: 'parent',
        status: 'active',
      },
      {
        email: 'new@example.com',
        username: 'New',
        role: 'premium',
        is_admin: true,
        user_type: 'parent',
        status: 'active',
      },
      1,
    )

    expect(payload).toEqual({
      email: 'new@example.com',
      username: 'New',
      role: 'premium',
      is_admin: true,
    })
  })

  it('does not include admin permission changes when editing the current user', () => {
    const payload = buildAdminUserUpdatePayload(
      {
        id: 10,
        email: 'admin@example.com',
        username: 'Admin',
        role: 'premium',
        is_admin: true,
        user_type: 'parent',
        status: 'active',
      },
      {
        email: 'admin@example.com',
        username: 'Admin',
        role: 'premium',
        is_admin: false,
        user_type: 'parent',
        status: 'active',
      },
      10,
    )

    expect(payload).toEqual({})
    expect(canChangeAdminPermission(10, 10)).toBe(false)
    expect(canChangeAdminPermission(11, 10)).toBe(true)
  })
})
