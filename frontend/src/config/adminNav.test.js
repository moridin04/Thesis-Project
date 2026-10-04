import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ADMIN_NAV_ITEMS, ADMIN_ROUTE_ROLES, adminNavItemsForRole, canAccessAdmin } from './adminNav.js'

test('Public Exports tab sits right after Review Uploads', () => {
  const keys = ADMIN_NAV_ITEMS.map((item) => item.key)
  assert.equal(keys.indexOf('public-exports'), keys.indexOf('review-uploads') + 1)
})

test('only admins see the Public Exports tab or reach its route', () => {
  assert.deepEqual(ADMIN_ROUTE_ROLES, ['admin'])
  assert.equal(canAccessAdmin('admin'), true)
  assert.ok(adminNavItemsForRole('admin').some((item) => item.to === '/admin/public-exports'))
  for (const role of ['staff', undefined, null, '']) {
    assert.equal(canAccessAdmin(role), false)
    assert.deepEqual(adminNavItemsForRole(role), [])
  }
})
