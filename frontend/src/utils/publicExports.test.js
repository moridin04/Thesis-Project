import assert from 'node:assert/strict'
import { test } from 'node:test'

import { PUBLIC_EXPORT_COLUMNS, publicExportButtonState, publishedExportsSummary } from './publicExports.js'

test('public export buttons are disabled with "Not yet available" when nothing is approved', () => {
  for (const published of [[], undefined, null]) {
    for (const kind of ['csv', 'report']) {
      const state = publicExportButtonState(published, kind)
      assert.equal(state.available, false)
      assert.equal(state.label, 'Not yet available')
    }
  }
})

test('only the approved kind becomes available, with its version and approval date', () => {
  const published = [{ kind: 'csv', version: 3, approved_at: '2026-10-01T02:00:00Z', row_count: 897 }]
  const csv = publicExportButtonState(published, 'csv')
  assert.equal(csv.available, true)
  assert.equal(csv.label, 'Export as CSV')
  assert.match(csv.detail, /^Version 3, approved .*2026/)
  assert.equal(publicExportButtonState(published, 'report').label, 'Not yet available')
})

test('export card summary lists each approved kind with version and date', () => {
  assert.equal(publishedExportsSummary([]), '')
  const summary = publishedExportsSummary([
    { kind: 'report', version: 1, approved_at: '2026-10-02T02:00:00Z' },
    { kind: 'csv', version: 2, approved_at: '2026-10-04T02:00:00Z' },
  ])
  assert.match(summary, /^Approved: CSV v2 \(.*2026\) · Report v1 \(.*2026\)$/)
})

test('column checklist matches the server whitelist exactly', () => {
  assert.deepEqual(
    PUBLIC_EXPORT_COLUMNS.map((column) => column.key),
    ['barangay', 'district', 'area', 'hazard', 'exposure', 'vulnerability', 'dpi_scaled', 'priority_class'],
  )
})
