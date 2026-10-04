import assert from 'node:assert/strict'
import { test } from 'node:test'

import { barangayHeading } from './barangayHeading.js'

test('uses the plain area value as the district name', () => {
  assert.equal(barangayHeading('Barangay 310', 'Santa Cruz'), 'Barangay 310, Santa Cruz, Manila')
  assert.equal(barangayHeading('Barangay 20', 'Tondo I / II'), 'Barangay 20, Tondo I / II, Manila')
})

test('uses the text after " - " when the area includes a district number', () => {
  assert.equal(barangayHeading('Barangay 310', 'District III - Santa Cruz'), 'Barangay 310, Santa Cruz, Manila')
})

test('falls back to "<Name>, Manila" when there is no area', () => {
  for (const area of [undefined, null, '', '   ']) {
    assert.equal(barangayHeading('Tutuban Mall', area), 'Tutuban Mall, Manila')
  }
})
