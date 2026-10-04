import { DISCLAIMER_VERSION } from './disclaimer.js'

export const DISCLAIMER_ACK_KEY = 'agos.disclaimer.ack'

let memoryRecord = null

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

export function isValidAcknowledgement(record, version = DISCLAIMER_VERSION) {
  return Boolean(record && record.version === version)
}

export function isDisclaimerExcludedPath(pathname) {
  const path = String(pathname || '/').split('?')[0].split('#')[0]
  const normalized = path.replace(/\/+$/, '') || '/'
  if (normalized === '/login' || normalized.startsWith('/login/')) return true
  if (normalized === '/admin' || normalized.startsWith('/admin/')) return true
  return false
}

export function shouldShowDisclaimer({ pathname, record, reopen = false, version = DISCLAIMER_VERSION }) {
  if (isDisclaimerExcludedPath(pathname)) return false
  if (reopen) return true
  return !isValidAcknowledgement(record, version)
}

function readFrom(name) {
  try {
    const store = storeOf(name)
    if (!store) return null
    return parseAcknowledgement(store.getItem(DISCLAIMER_ACK_KEY))
  } catch {
    return null
  }
}

export function readAcknowledgement() {
  return readFrom('localStorage') || readFrom('sessionStorage') || memoryRecord
}

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
  memoryRecord = record
  return 'memory'
}

export function buildAcknowledgement(now = new Date()) {
  return {
    version: DISCLAIMER_VERSION,
    acknowledgedAt: now.toISOString(),
  }
}

export function disclaimerDialogAria(titleId, bodyId) {
  return {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId,
    'aria-describedby': bodyId,
  }
}

export function initialDisclaimerFocus(mode) {
  return mode === 'reopen' ? 'submit' : 'checkbox'
}

export function canConfirmDisclaimer(mode, agreed) {
  return mode === 'reopen' || Boolean(agreed)
}

export function gateAllowsDismiss(mode, via) {
  if (mode !== 'reopen') return false
  return via === 'escape' || via === 'backdrop'
}

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

export function seedDisclaimerAcknowledgement(overrides = {}) {
  const record = {
    version: DISCLAIMER_VERSION,
    acknowledgedAt: new Date().toISOString(),
    ...overrides,
  }
  writeAcknowledgement(record)
  return record
}

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
