/*
 * Checks the one illustrative barangay photo lookup.
 * getBarangayPhoto lives in barangayPhotos.js for the priority map.
 * Unknown ids, including odd keys, must return null.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getBarangayPhoto } from './barangayPhotos.js'

// Barangay 310 returns the Recto photo, its alt text, and a credit link.
test('returns the illustrative photo for Barangay 310', () => {
  const photo = getBarangayPhoto('Barangay 310')
  assert.ok(photo)
  assert.match(photo.src, /recto-santa-cruz-quiapo-bus-terminal\.webp$/)
  assert.equal(photo.alt, 'Illustrative street scene near a bus terminal in Recto, Santa Cruz, Manila')
  assert.ok(photo.creditText.includes(photo.creditLinkText))
})

// Other barangays and bad input have no photo.
test('returns null for other barangays and missing input', () => {
  assert.equal(getBarangayPhoto('Barangay 628'), null)
  assert.equal(getBarangayPhoto(undefined), null)
  assert.equal(getBarangayPhoto('constructor'), null)
})
