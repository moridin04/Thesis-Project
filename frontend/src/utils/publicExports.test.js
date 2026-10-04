import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  MANDATORY_EXPORT_COLUMNS,
  PUBLIC_EXPORT_COLUMN_GROUPS,
  PUBLIC_EXPORT_COLUMNS,
  planningNeedsPriorityClass,
  publicExportButtonState,
  publishedExportsSummary,
  titlePlaceholder,
  toggleExportColumn,
} from './publicExports.js'

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

test('column checklist matches the server whitelist, grouped, with mandatory columns', () => {
  assert.deepEqual(
    PUBLIC_EXPORT_COLUMNS.map((column) => column.key),
    [
      'barangay',
      'district',
      'area',
      'dpi_scaled',
      'priority_class',
      'population_2024',
      'flood_pct_5yr',
      'flood_pct_25yr',
      'elevation_mean',
      'hazard',
      'exposure',
      'vulnerability',
      'planning_reference',
      'drrm_pillar',
    ],
  )
  assert.deepEqual(
    PUBLIC_EXPORT_COLUMN_GROUPS.map((group) => [group.id, group.label, group.keys]),
    [
      ['identity', 'Identity', ['barangay', 'district', 'area']],
      ['scores', 'Scores', ['dpi_scaled', 'priority_class', 'hazard', 'exposure', 'vulnerability']],
      ['context', 'Context', ['population_2024', 'flood_pct_5yr', 'flood_pct_25yr', 'elevation_mean']],
      ['planning', 'Planning', ['planning_reference', 'drrm_pillar']],
    ],
  )
  assert.deepEqual(MANDATORY_EXPORT_COLUMNS, ['barangay', 'dpi_scaled', 'priority_class'])
  assert.equal(planningNeedsPriorityClass(['barangay', 'planning_reference']), true)
  assert.equal(planningNeedsPriorityClass(['barangay', 'priority_class', 'planning_reference']), false)
  assert.deepEqual(toggleExportColumn(['barangay', 'dpi_scaled', 'priority_class'], 'barangay'), [
    'barangay',
    'dpi_scaled',
    'priority_class',
  ])
  assert.ok(toggleExportColumn(['barangay', 'dpi_scaled'], 'planning_reference').includes('priority_class'))
  assert.equal(titlePlaceholder('csv'), 'AGOS Barangay Risk Summary - CSV')
  assert.equal(titlePlaceholder('report'), 'AGOS Barangay Risk Summary - Report')
  assert.ok(!titlePlaceholder('csv').includes('.csv'))
})
