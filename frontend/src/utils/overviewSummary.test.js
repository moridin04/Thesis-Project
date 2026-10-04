import assert from 'node:assert/strict'
import { test } from 'node:test'

import { summaryCounts } from './overviewSummary.js'

const rows = [
  { riskLevel: 'High', district: 'District I' },
  { riskLevel: 'High', district: 'District III' },
  { riskLevel: 'Medium', district: 'District III' },
  { riskLevel: 'Low', district: 'District III' },
  { riskLevel: 'Low', district: 'District VI' },
  { riskLevel: 'Low', district: 'District VI' },
]

test('unfiltered: headline is the analyzed total and the classes add up to it', () => {
  const counts = summaryCounts(rows, rows, false)
  assert.equal(counts.analyzed, 6)
  assert.equal(counts.analyzedHint, undefined)
  assert.deepEqual([counts.High, counts.Medium, counts.Low], [2, 1, 3])
  assert.equal(counts.High + counts.Medium + counts.Low, counts.analyzed)
})

test('filtered: headline stays the full total and the hint shows the filtered count', () => {
  const filtered = rows.filter((row) => row.district === 'District III')
  const counts = summaryCounts(rows, filtered, true)
  assert.equal(counts.analyzed, 6)
  assert.equal(counts.analyzedHint, 'Showing 3 filtered')
  assert.deepEqual([counts.High, counts.Medium, counts.Low], [1, 1, 1])
})

test('priority filter: only the chosen class is counted', () => {
  const filtered = rows.filter((row) => row.riskLevel === 'Low')
  const counts = summaryCounts(rows, filtered, true)
  assert.deepEqual([counts.High, counts.Medium, counts.Low], [0, 0, 3])
  assert.equal(counts.analyzedHint, 'Showing 3 filtered')
})
