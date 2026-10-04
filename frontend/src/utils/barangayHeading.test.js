/*
 * Checks the barangay profile heading.
 * barangayHeading lives in barangayHeading.js and is used on the profile page.
 * A district prefix in the area string should not appear in the title.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { barangayHeading } from './barangayHeading.js'

// A plain area name is the district in the heading.
test('uses the plain area value as the district name', () => {
  assert.equal(barangayHeading('Barangay 310', 'Santa Cruz'), 'Barangay 310, Santa Cruz, Manila')
  assert.equal(barangayHeading('Barangay 20', 'Tondo I / II'), 'Barangay 20, Tondo I / II, Manila')
})

// "District III - Santa Cruz" keeps only Santa Cruz in the title.
test('uses the text after " - " when the area includes a district number', () => {
  assert.equal(barangayHeading('Barangay 310', 'District III - Santa Cruz'), 'Barangay 310, Santa Cruz, Manila')
})

// Missing or blank area falls back to the name and Manila.
test('falls back to "<Name>, Manila" when there is no area', () => {
  for (const area of [undefined, null, '', '   ']) {
    assert.equal(barangayHeading('Tutuban Mall', area), 'Tutuban Mall, Manila')
  }
})
