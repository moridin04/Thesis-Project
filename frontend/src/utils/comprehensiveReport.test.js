/*
 * Checks file size, generated time, and the PDF filename.
 * The helpers live in comprehensiveReport.js for the reports page.
 * Dates are expected in Asia/Manila, not the machine's local zone.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatFileSize, formatGeneratedAt, reportFilename } from './comprehensiveReport.js'

// Small files stay in bytes. Larger ones switch to KB or MB.
test('file sizes are shown in B, KB or MB', () => {
  assert.equal(formatFileSize(512), '512 B')
  assert.equal(formatFileSize(1932288), '1.8 MB')
  assert.equal(formatFileSize(40960), '40 KB')
  assert.equal(formatFileSize(undefined), '')
})

// A UTC evening is already the next calendar day in Manila.
test('filename and generated time use the Manila date', () => {
  assert.equal(
    reportFilename('2026-10-04T17:30:00+00:00'),
    'Manila_Barangay_Flood_Risk_Comprehensive_Report_2026-10-05.pdf',
  )
  assert.match(formatGeneratedAt('2026-10-04T17:30:00+00:00'), /Oct 5, 2026/)
  assert.equal(formatGeneratedAt(null), '')
})
