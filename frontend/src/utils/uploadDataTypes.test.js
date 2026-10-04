import assert from 'node:assert/strict'
import { test } from 'node:test'

import { UPLOAD_DATA_TYPES, dataTypeLabel } from './uploadDataTypes.js'

test('lists the project dataset types with stable internal values', () => {
  assert.deepEqual(
    UPLOAD_DATA_TYPES.map((type) => type.value),
    ['flood_hazard_5yr', 'flood_hazard_25yr', 'elevation_dtm', 'population', 'barangay_boundaries', 'other'],
  )
})

test('maps each internal value to its friendly label', () => {
  assert.equal(dataTypeLabel('flood_hazard_5yr'), 'Flood hazard (LiPAD), 5-year return period')
  assert.equal(dataTypeLabel('flood_hazard_25yr'), 'Flood hazard (LiPAD), 25-year return period')
  assert.equal(dataTypeLabel('elevation_dtm'), 'Elevation (DTM)')
  assert.equal(dataTypeLabel('population'), 'Population (PSA 2020 and 2024)')
  assert.equal(dataTypeLabel('barangay_boundaries'), 'Barangay boundaries')
  assert.equal(dataTypeLabel('other'), 'Other (specify in notes)')
})

test('falls back to the raw value for old free-text records, and a dash when empty', () => {
  assert.equal(dataTypeLabel('Flood depth'), 'Flood depth')
  assert.equal(dataTypeLabel('Evacuation routes'), 'Evacuation routes')
  for (const value of [undefined, null, '', '  ']) {
    assert.equal(dataTypeLabel(value), '—')
  }
})
