import assert from 'node:assert/strict'
import { test } from 'node:test'

import { compareDistrictArea, districtAreaLabel, districtAreaParts } from './districtLabel.js'

test('joins district and area like the Rankings page', () => {
  assert.equal(districtAreaLabel('District III', 'Santa Cruz'), 'District III - Santa Cruz')
  assert.equal(districtAreaLabel('District I', 'Tondo I / II'), 'District I - Tondo I / II')
  assert.deepEqual(districtAreaParts('District III', ' Santa Cruz '), ['District III -', 'Santa Cruz'])
})

test('shows the district alone when the area is missing', () => {
  assert.equal(districtAreaLabel('District III', undefined), 'District III')
  assert.equal(districtAreaLabel('District III', null), 'District III')
  assert.deepEqual(districtAreaParts('District III', undefined), ['District III'])
})

test('shows the district alone when the area is blank', () => {
  assert.equal(districtAreaLabel('District III', ''), 'District III')
  assert.equal(districtAreaLabel('District III', '   '), 'District III')
  assert.deepEqual(districtAreaParts('District III', '   '), ['District III'])
})

test('sorts by district number, then area name', () => {
  const rows = [
    { district: 'District VI', area: 'Sampaloc' },
    { district: 'District III', area: 'Santa Cruz' },
    { district: 'District X', area: 'Example' },
    { district: 'District III', area: 'Binondo' },
    { district: 'District IX', area: 'Example' },
    { district: 'District I', area: 'Tondo I / II' },
  ]
  assert.deepEqual(
    [...rows].sort(compareDistrictArea).map((row) => districtAreaLabel(row.district, row.area)),
    [
      'District I - Tondo I / II',
      'District III - Binondo',
      'District III - Santa Cruz',
      'District VI - Sampaloc',
      'District IX - Example',
      'District X - Example',
    ],
  )
})
