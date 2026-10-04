import assert from 'node:assert/strict'
import { test } from 'node:test'

import { REPORT_ROUTE_ROLES, canRegenerateReport, dashboardNavItemsForRole } from './dashboardNav.js'

const keysFor = (role) => dashboardNavItemsForRole(role).map((item) => item.key)

test('Reports sits right below Model Results for staff and admin', () => {
  for (const role of ['staff', 'admin']) {
    const keys = keysFor(role)
    assert.equal(keys.indexOf('reports'), keys.indexOf('model-results') + 1)
  }
  assert.deepEqual(REPORT_ROUTE_ROLES, ['staff', 'admin'])
})

test('Reports is hidden for anonymous users', () => {
  for (const role of [undefined, null, '']) {
    assert.equal(keysFor(role).includes('reports'), false)
  }
})

test('only admins can regenerate the report', () => {
  assert.equal(canRegenerateReport('admin'), true)
  for (const role of ['staff', undefined, null, '']) {
    assert.equal(canRegenerateReport(role), false)
  }
})
