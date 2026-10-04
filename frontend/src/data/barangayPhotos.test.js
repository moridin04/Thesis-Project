import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getBarangayPhoto } from './barangayPhotos.js'

test('returns the illustrative photo for Barangay 310', () => {
  const photo = getBarangayPhoto('Barangay 310')
  assert.ok(photo)
  assert.match(photo.src, /recto-santa-cruz-quiapo-bus-terminal\.webp$/)
  assert.equal(photo.alt, 'Illustrative street scene near a bus terminal in Recto, Santa Cruz, Manila')
  assert.ok(photo.creditText.includes(photo.creditLinkText))
})

test('returns null for other barangays and missing input', () => {
  assert.equal(getBarangayPhoto('Barangay 628'), null)
  assert.equal(getBarangayPhoto(undefined), null)
  assert.equal(getBarangayPhoto('constructor'), null)
})
