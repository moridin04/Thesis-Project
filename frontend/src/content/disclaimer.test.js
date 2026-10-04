/*
 * Checks the disclaimer copy, version, and acknowledgement rules.
 * The helpers live in disclaimer.js and disclaimerAck.js.
 * One case also reads the Python export disclaimer so the sentences match.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  DISCLAIMER_BODY,
  DISCLAIMER_BUTTON_LABEL,
  DISCLAIMER_CHECKBOX_LABEL,
  DISCLAIMER_CORE,
  DISCLAIMER_LEAD,
  DISCLAIMER_TITLE,
  DISCLAIMER_VERSION,
} from './disclaimer.js'
import { DEFAULT_DISCLAIMER } from '../utils/publicExports.js'
import {
  buildAcknowledgement,
  canConfirmDisclaimer,
  clearDisclaimerAcknowledgement,
  disclaimerDialogAria,
  gateAllowsDismiss,
  initialDisclaimerFocus,
  isDisclaimerExcludedPath,
  isValidAcknowledgement,
  parseAcknowledgement,
  readAcknowledgement,
  seedDisclaimerAcknowledgement,
  shouldShowDisclaimer,
  writeAcknowledgement,
} from './disclaimerAck.js'

// The core sentence matches the export helper and the Python constant.
test('core sentence matches the public export disclaimer', () => {
  assert.equal(DISCLAIMER_CORE, DEFAULT_DISCLAIMER)
  assert.equal(
    DISCLAIMER_CORE,
    'For information purposes only. Not a warning system. Priority classes are relative tertiles across Manila barangays, not official flood warnings.',
  )
  const py = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../../backend/app/exports/disclaimer.py'),
    'utf8',
  )
  const block = py.split('EXPORT_DISCLAIMER')[1] ?? ''
  const joined = [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]).join('')
  assert.equal(joined, DISCLAIMER_CORE)
})

// Locks the version string and the title, lead, checkbox, and button text.
test('copy uses the agreed title, lead, checkbox and button labels', () => {
  assert.equal(DISCLAIMER_VERSION, '2026-10-05-1')
  assert.equal(DISCLAIMER_TITLE, 'Important Notice')
  assert.equal(DISCLAIMER_LEAD, 'AGOS is a flood-risk prioritization tool for Manila barangays.')
  assert.equal(DISCLAIMER_CHECKBOX_LABEL, 'I have read and agree to these terms')
  assert.equal(DISCLAIMER_BUTTON_LABEL, 'I understand')
  assert.equal(DISCLAIMER_BODY.length, 4)
  assert.match(DISCLAIMER_BODY[2], /thesis project/)
  assert.doesNotMatch(DISCLAIMER_BODY.join(' '), /hotline|NDRRMC|PAGASA/i)
})

// No stored ack opens the gate. A matching version keeps it closed.
test('shows on first visit and hides when a valid acknowledgement exists', () => {
  clearDisclaimerAcknowledgement()
  assert.equal(shouldShowDisclaimer({ pathname: '/', record: null }), true)
  assert.equal(shouldShowDisclaimer({ pathname: '/priority-map', record: null }), true)
  assert.equal(shouldShowDisclaimer({ pathname: '/rankings', record: null }), true)
  const valid = { version: DISCLAIMER_VERSION, acknowledgedAt: '2026-10-05T00:00:00.000Z' }
  assert.equal(shouldShowDisclaimer({ pathname: '/', record: valid }), false)
})

// An older version string is not valid, so the gate opens again.
test('shows again when the stored version differs', () => {
  const stale = { version: '2026-01-01-0', acknowledgedAt: '2026-01-01T00:00:00.000Z' }
  assert.equal(isValidAcknowledgement(stale), false)
  assert.equal(shouldShowDisclaimer({ pathname: '/', record: stale }), true)
})

// The first gate needs the checkbox. Confirm stores the version and time.
test('button stays disabled until the checkbox is ticked; confirm stores version and time', () => {
  assert.equal(canConfirmDisclaimer('gate', false), false)
  assert.equal(canConfirmDisclaimer('gate', true), true)
  assert.equal(canConfirmDisclaimer('reopen', false), true)
  const memory = new Map()
  const fake = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  }
  globalThis.localStorage = fake
  globalThis.sessionStorage = fake
  clearDisclaimerAcknowledgement()
  const record = buildAcknowledgement(new Date('2026-10-05T05:00:00.000Z'))
  assert.equal(writeAcknowledgement(record), 'localStorage')
  assert.deepEqual(readAcknowledgement(), {
    version: DISCLAIMER_VERSION,
    acknowledgedAt: '2026-10-05T05:00:00.000Z',
  })
  assert.equal(shouldShowDisclaimer({ pathname: '/', record: readAcknowledgement() }), false)
  clearDisclaimerAcknowledgement()
  delete globalThis.localStorage
  delete globalThis.sessionStorage
})

// Escape and a backdrop click close reopen mode, not the first gate.
test('Escape and backdrop click do not close the gate; they close the footer reopen mode', () => {
  assert.equal(gateAllowsDismiss('gate', 'escape'), false)
  assert.equal(gateAllowsDismiss('gate', 'backdrop'), false)
  assert.equal(gateAllowsDismiss('reopen', 'escape'), true)
  assert.equal(gateAllowsDismiss('reopen', 'backdrop'), true)
  assert.equal(shouldShowDisclaimer({ pathname: '/', record: { version: DISCLAIMER_VERSION, acknowledgedAt: 'x' }, reopen: true }), true)
})

// Login and admin paths stay closed even when there is no acknowledgement.
test('is not shown on login or admin routes', () => {
  for (const pathname of ['/login', '/login/', '/admin', '/admin/review-uploads', '/admin/login']) {
    assert.equal(isDisclaimerExcludedPath(pathname), true)
    assert.equal(shouldShowDisclaimer({ pathname, record: null }), false)
  }
  for (const pathname of ['/', '/priority-map', '/rankings', '/overview', '/unauthorized', '/dashboard/overview']) {
    assert.equal(isDisclaimerExcludedPath(pathname), false)
    assert.equal(shouldShowDisclaimer({ pathname, record: null }), true)
  }
})

// If both stores throw, the ack stays in memory so this session can continue.
test('storage failure does not crash and still lets the user continue for the session', () => {
  const throwing = {
    getItem() {
      throw new Error('blocked')
    },
    setItem() {
      throw new Error('blocked')
    },
    removeItem() {
      throw new Error('blocked')
    },
  }
  globalThis.localStorage = throwing
  globalThis.sessionStorage = throwing
  assert.equal(readAcknowledgement(), null)
  const record = buildAcknowledgement()
  assert.equal(writeAcknowledgement(record), 'memory')
  assert.deepEqual(readAcknowledgement(), record)
  assert.equal(shouldShowDisclaimer({ pathname: '/', record: readAcknowledgement() }), false)
  clearDisclaimerAcknowledgement()
  delete globalThis.localStorage
  delete globalThis.sessionStorage
})

// Dialog labeling, and whether focus starts on the checkbox or Close.
test('dialog aria attributes and initial focus target', () => {
  assert.deepEqual(disclaimerDialogAria('d-title', 'd-body'), {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'd-title',
    'aria-describedby': 'd-body',
  })
  assert.equal(initialDisclaimerFocus('gate'), 'checkbox')
  assert.equal(initialDisclaimerFocus('reopen'), 'submit')
})

// The seed helper writes a valid ack. Broken JSON counts as no ack.
test('seed helper writes a valid acknowledgement used by other tests', () => {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  }
  const seeded = seedDisclaimerAcknowledgement()
  assert.equal(isValidAcknowledgement(seeded), true)
  assert.equal(parseAcknowledgement('not-json'), null)
  assert.equal(parseAcknowledgement('{"version":1}'), null)
  clearDisclaimerAcknowledgement()
  delete globalThis.localStorage
})
