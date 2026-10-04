/*
 * Checks upload data-type labels and how notes store a source.
 * The list lives in uploadDataTypes.js and must match the backend values.
 * Old free-text types should still display as they were saved.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { UPLOAD_DATA_TYPES, composeUploadNotes, dataTypeLabel } from './uploadDataTypes.js'

// The internal values stay in this order for the upload form.
test('lists the project dataset types with stable internal values', () => {
  assert.deepEqual(
    UPLOAD_DATA_TYPES.map((type) => type.value),
    ['flood_hazard_5yr', 'flood_hazard_25yr', 'elevation_dtm', 'population', 'barangay_boundaries', 'other'],
  )
})

// Each value maps to a label that does not name a single data agency.
test('maps each internal value to its source-neutral label', () => {
  assert.equal(dataTypeLabel('flood_hazard_5yr'), 'Flood hazard, 5-year return period')
  assert.equal(dataTypeLabel('flood_hazard_25yr'), 'Flood hazard, 25-year return period')
  assert.equal(dataTypeLabel('elevation_dtm'), 'Elevation (DTM)')
  assert.equal(dataTypeLabel('population'), 'Population (2020 and 2024)')
  assert.equal(dataTypeLabel('barangay_boundaries'), 'Barangay boundaries')
  assert.equal(dataTypeLabel('other'), 'Other (specify in notes)')
  for (const type of UPLOAD_DATA_TYPES) {
    assert.doesNotMatch(type.label, /LiPAD|PSA/)
  }
})

// Text from before the list existed is shown as saved. Empty becomes a dash.
test('falls back to the raw value for old free-text records, and a dash when empty', () => {
  assert.equal(dataTypeLabel('Flood depth'), 'Flood depth')
  assert.equal(dataTypeLabel('Flood hazard (LiPAD), 5-year return period'), 'Flood hazard (LiPAD), 5-year return period')
  for (const value of [undefined, null, '', '  ']) {
    assert.equal(dataTypeLabel(value), '—')
  }
})

// An optional source is the first line of notes. Notes alone stay as typed.
test('stores the optional data source as the first line of notes', () => {
  assert.equal(composeUploadNotes('City Planning Office', 'Collected June 2026'), 'Source: City Planning Office\nCollected June 2026')
  assert.equal(composeUploadNotes('  City Planning Office ', ''), 'Source: City Planning Office')
  assert.equal(composeUploadNotes('', ' Collected June 2026 '), 'Collected June 2026')
  assert.equal(composeUploadNotes(undefined, undefined), '')
})
