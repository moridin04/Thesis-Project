/*
 * Remembers that the visitor accepted the current disclaimer.
 * DisclaimerGate.jsx reads and writes through these helpers.
 * The storage key is agos.disclaimer.ack. Login and admin routes are skipped.
 */
import { DISCLAIMER_VERSION } from './disclaimer.js'

// Key for the JSON ack in localStorage or sessionStorage.
export const DISCLAIMER_ACK_KEY = 'agos.disclaimer.ack'

// Used only when both browser stores are missing or throw.
let memoryRecord = null

// Return the store, or null if it is missing or reading it throws.
function storeOf(name) {
  try {
    const store = globalThis[name]
    if (!store || typeof store.getItem !== 'function' || typeof store.setItem !== 'function') {
      return null
    }
    return store
  } catch {
    return null
  }
}

// Turn stored JSON into version and time, or null when it is not an ack.
export function parseAcknowledgement(raw) {
  if (!raw || typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const version = typeof parsed.version === 'string' ? parsed.version : ''
    const acknowledgedAt = typeof parsed.acknowledgedAt === 'string' ? parsed.acknowledgedAt : ''
    if (!version) return null
    return { version, acknowledgedAt }
  } catch {
    return null
  }
}

// True only when the stored version matches the current disclaimer text.
export function isValidAcknowledgement(record, version = DISCLAIMER_VERSION) {
  return Boolean(record && record.version === version)
}

// Login and admin paths never show the gate. Query and hash are ignored.
export function isDisclaimerExcludedPath(pathname) {
  const path = String(pathname || '/').split('?')[0].split('#')[0]
  const normalized = path.replace(/\/+$/, '') || '/'
  if (normalized === '/login' || normalized.startsWith('/login/')) return true
  if (normalized === '/admin' || normalized.startsWith('/admin/')) return true
  return false
}

// Open on first visit, when the version is stale, or when reopen is asked.
export function shouldShowDisclaimer({ pathname, record, reopen = false, version = DISCLAIMER_VERSION }) {
  if (isDisclaimerExcludedPath(pathname)) return false
  if (reopen) return true
  return !isValidAcknowledgement(record, version)
}

// Read one store. A throw, or a bad value, becomes null.
function readFrom(name) {
  try {
    const store = storeOf(name)
    if (!store) return null
    return parseAcknowledgement(store.getItem(DISCLAIMER_ACK_KEY))
  } catch {
    return null
  }
}

// localStorage first, then sessionStorage, then the in-memory copy.
export function readAcknowledgement() {
  return readFrom('localStorage') || readFrom('sessionStorage') || memoryRecord
}

// Save the ack. If a store throws, try the next one, then memory.
export function writeAcknowledgement(record) {
  const payload = JSON.stringify({
    version: record.version,
    acknowledgedAt: record.acknowledgedAt,
  })
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      const store = storeOf(name)
      if (!store) continue
      store.setItem(DISCLAIMER_ACK_KEY, payload)
      memoryRecord = record
      return name
    } catch {
      /* try the next store */
    }
  }
  // Both stores threw or were missing. This tab can continue, but a reload forgets it.
  memoryRecord = record
  return 'memory'
}

// Ack for the current DISCLAIMER_VERSION, stamped at now.
export function buildAcknowledgement(now = new Date()) {
  return {
    version: DISCLAIMER_VERSION,
    acknowledgedAt: now.toISOString(),
  }
}

// Props that mark the card as a modal dialog for assistive tech.
export function disclaimerDialogAria(titleId, bodyId) {
  return {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId,
    'aria-describedby': bodyId,
  }
}

// First visit focuses the checkbox. Reopen focuses the close button.
export function initialDisclaimerFocus(mode) {
  return mode === 'reopen' ? 'submit' : 'checkbox'
}

// Reopen can close with no checkbox. The first gate needs a tick.
export function canConfirmDisclaimer(mode, agreed) {
  return mode === 'reopen' || Boolean(agreed)
}

// Escape and backdrop close reopen mode only, not the first gate.
export function gateAllowsDismiss(mode, via) {
  if (mode !== 'reopen') return false
  return via === 'escape' || via === 'backdrop'
}

// Focusable controls inside the dialog that are actually visible.
export function getFocusable(container) {
  if (!container || typeof container.querySelectorAll !== 'function') return []
  const nodes = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  return Array.from(nodes).filter((node) => {
    if (node.hasAttribute('disabled')) return false
    return node.getClientRects().length > 0
  })
}

// Keep Tab and Shift+Tab cycling inside the dialog.
export function trapTabKey(event, container) {
  if (!event || event.key !== 'Tab') return
  const focusable = getFocusable(container)
  if (focusable.length === 0) {
    event.preventDefault()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}

// Write a valid ack for tests. overrides can replace version or time.
export function seedDisclaimerAcknowledgement(overrides = {}) {
  const record = {
    version: DISCLAIMER_VERSION,
    acknowledgedAt: new Date().toISOString(),
    ...overrides,
  }
  writeAcknowledgement(record)
  return record
}

// Remove the key from both stores and forget the memory copy.
export function clearDisclaimerAcknowledgement() {
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      storeOf(name)?.removeItem(DISCLAIMER_ACK_KEY)
    } catch {
      /* ignore */
    }
  }
  memoryRecord = null
}
