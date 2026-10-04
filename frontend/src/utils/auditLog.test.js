/*
 * Checks audit action labels, filter groups, and the 50-row page size.
 * The helpers live in auditLog.js and feed the admin audit log page.
 * A full page of 50 is what tells the page there may be more rows.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  AUDIT_ACTION_GROUPS,
  AUDIT_PAGE_SIZE,
  auditActionLabel,
  auditLogParams,
  hasMoreAuditRows,
} from './auditLog.js'

// Known actions use the label table. An unknown one is capitalized words.
test('export, report and existing actions get readable labels', () => {
  assert.equal(auditActionLabel('export_approved'), 'Export approved')
  assert.equal(auditActionLabel('export_superseded'), 'Export superseded')
  assert.equal(auditActionLabel('export_downloaded_public'), 'Public download')
  assert.equal(auditActionLabel('report_regenerated'), 'Report regenerated')
  assert.equal(auditActionLabel('upload_submitted'), 'Upload submitted')
  assert.equal(auditActionLabel('login_success'), 'Signed in')
  assert.equal(auditActionLabel('model_published'), 'Model published')
  assert.equal(auditActionLabel(''), '')
})

// The filter offers All plus the four groups the API understands.
test('Action filter offers All, Uploads, Exports, Reports and Accounts', () => {
  assert.deepEqual(
    AUDIT_ACTION_GROUPS.map((group) => group.label),
    ['All', 'Uploads', 'Exports', 'Reports', 'Accounts'],
  )
  assert.equal(AUDIT_ACTION_GROUPS[0].value, '')
})

// Empty filters are omitted. A full page of 50 means more rows may exist.
test('filter params only include the chosen group and date', () => {
  assert.deepEqual(auditLogParams(), { limit: AUDIT_PAGE_SIZE, offset: 0 })
  assert.deepEqual(auditLogParams({ group: 'exports', date: '2026-10-05', offset: 50 }), {
    limit: AUDIT_PAGE_SIZE,
    offset: 50,
    group: 'exports',
    date: '2026-10-05',
  })
  assert.equal(hasMoreAuditRows(AUDIT_PAGE_SIZE), true)
  assert.equal(hasMoreAuditRows(3), false)
})
