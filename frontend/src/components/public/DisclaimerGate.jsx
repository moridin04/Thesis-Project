/*
 * Blocks public pages until the visitor accepts the disclaimer.
 * main.jsx wraps the app in this gate. Login and admin are excluded.
 * disclaimerAck.js stores the ack under agos.disclaimer.ack.
 * If storage throws, the ack stays in memory for this tab only.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  DISCLAIMER_BODY,
  DISCLAIMER_BUTTON_LABEL,
  DISCLAIMER_CHECKBOX_LABEL,
  DISCLAIMER_CLOSE_LABEL,
  DISCLAIMER_LEAD,
  DISCLAIMER_TITLE,
} from '../../content/disclaimer.js'
import {
  buildAcknowledgement,
  canConfirmDisclaimer,
  disclaimerDialogAria,
  gateAllowsDismiss,
  initialDisclaimerFocus,
  isDisclaimerExcludedPath,
  readAcknowledgement,
  shouldShowDisclaimer,
  trapTabKey,
  writeAcknowledgement,
} from '../../content/disclaimerAck.js'
import { DisclaimerContext, useDisclaimer } from './disclaimerContext.js'

// Footer and map button. Opens the dialog again without a new checkbox.
export function DisclaimerReopenButton({ className }) {
  const { reopen } = useDisclaimer()
  return (
    <button type="button" className={className} onClick={reopen}>
      Disclaimer
    </button>
  )
}

// The card. Gate mode needs the checkbox. Reopen mode can just close.
export function DisclaimerDialog({
  mode,
  agreed,
  nudge,
  onAgreedChange,
  onConfirm,
  onBlocked,
  onDismiss,
  titleId,
  bodyId,
  dialogRef,
  checkboxRef,
}) {
  const reopen = mode === 'reopen'
  const canConfirm = canConfirmDisclaimer(mode, agreed)
  const buttonLabel = reopen ? DISCLAIMER_CLOSE_LABEL : DISCLAIMER_BUTTON_LABEL

  // Backdrop clicks dismiss only in reopen mode. The first gate stays up.
  return (
    <div
      className="disclaimer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && gateAllowsDismiss(mode, 'backdrop')) onDismiss()
      }}
    >
      <form
        ref={dialogRef}
        {...disclaimerDialogAria(titleId, bodyId)}
        className="disclaimer-card card-surface"
        onSubmit={(event) => {
          event.preventDefault()
          if (canConfirm) onConfirm()
          else onBlocked()
        }}
      >
        <h2 id={titleId} className="font-display text-xl font-semibold text-heading">
          {DISCLAIMER_TITLE}
        </h2>
        <div id={bodyId} className="disclaimer-body space-y-3 text-sm leading-relaxed text-body">
          <p className="font-medium text-foundation">{DISCLAIMER_LEAD}</p>
          {DISCLAIMER_BODY.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <label
          className={`disclaimer-agree flex min-h-11 cursor-pointer items-start gap-3 text-sm font-medium text-foundation${nudge ? ' disclaimer-agree--nudge' : ''}`}
        >
          <input
            ref={checkboxRef}
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[color:var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
            checked={agreed}
            disabled={reopen}
            onChange={(event) => onAgreedChange(event.target.checked)}
          />
          <span>{DISCLAIMER_CHECKBOX_LABEL}</span>
        </label>
        <button
          type="submit"
          className="btn-primary w-full"
          aria-disabled={!canConfirm}
        >
          {buttonLabel}
        </button>
      </form>
    </div>
  )
}

// Remembers the ack, locks scroll while open, and keeps Tab in the dialog.
export default function DisclaimerGate({ children }) {
  const { pathname } = useLocation()
  const titleId = useId()
  const bodyId = useId()
  const dialogRef = useRef(null)
  const checkboxRef = useRef(null)
  const restoreFocusRef = useRef(null)
  const nudgeTimerRef = useRef(null)
  // localStorage, then sessionStorage, then memory if those stores threw.
  const [record, setRecord] = useState(() => readAcknowledgement())
  const [reopen, setReopen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [nudge, setNudge] = useState(false)
  const excluded = isDisclaimerExcludedPath(pathname)
  // Reopen is a second look. Gate is the first visit that must be accepted.
  const mode = reopen ? 'reopen' : 'gate'
  const open = shouldShowDisclaimer({ pathname, record, reopen })

  // Close the second look. The stored acknowledgement is left as it is.
  const closeReopen = useCallback(() => {
    setReopen(false)
    setAgreed(false)
    setNudge(false)
  }, [])

  // A tick clears the shake that follows an early submit.
  const handleAgreedChange = useCallback((checked) => {
    setAgreed(checked)
    if (checked) setNudge(false)
  }, [])

  // Submitted with the box unticked. Shake the row and focus the checkbox.
  const handleBlocked = useCallback(() => {
    setNudge(true)
    checkboxRef.current?.focus()
    window.clearTimeout(nudgeTimerRef.current)
    nudgeTimerRef.current = window.setTimeout(() => setNudge(false), 1200)
  }, [])

  // First visit writes the ack. Reopen only closes. A storage throw stays in memory.
  const confirm = useCallback(() => {
    if (reopen) {
      closeReopen()
      return
    }
    if (!canConfirmDisclaimer('gate', agreed)) return
    const next = buildAcknowledgement()
    writeAcknowledgement(next)
    setRecord(next)
    setAgreed(false)
  }, [agreed, closeReopen, reopen])

  // Remember focus so we can return to the button that opened the dialog.
  const handleReopen = useCallback(() => {
    if (excluded) return
    restoreFocusRef.current = document.activeElement
    setAgreed(true)
    setReopen(true)
  }, [excluded])

  // While open, hide body scroll, move focus, and trap Tab in the dialog.
  useEffect(() => {
    if (!open) return undefined
    restoreFocusRef.current = restoreFocusRef.current || document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (initialDisclaimerFocus(mode) === 'submit') {
      dialogRef.current?.querySelector('button[type="submit"]')?.focus()
    } else {
      checkboxRef.current?.focus()
    }
    // Escape closes reopen mode only. The first gate ignores it.
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        if (gateAllowsDismiss(mode, 'escape')) {
          event.preventDefault()
          closeReopen()
        }
        return
      }
      trapTabKey(event, dialogRef.current)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [closeReopen, mode, open])

  // When the dialog closes, focus the control that opened it.
  useEffect(() => {
    if (open) return undefined
    const target = restoreFocusRef.current
    restoreFocusRef.current = null
    if (target && typeof target.focus === 'function') {
      target.focus()
    }
    return undefined
  }, [open])

  // If the gate unmounts mid-dialog, restore scroll and clear the shake timer.
  useEffect(
    () => () => {
      document.body.style.overflow = ''
      window.clearTimeout(nudgeTimerRef.current)
    },
    [],
  )

  return (
    <DisclaimerContext.Provider value={{ reopen: handleReopen, isOpen: open }}>
      {/* Page stays mounted but inert so keyboard focus stays in the dialog. */}
      <div className={open ? 'disclaimer-inert' : undefined} {...(open ? { inert: true, 'aria-hidden': 'true' } : {})}>
        {children}
      </div>
      {open ? (
        <DisclaimerDialog
          mode={mode}
          agreed={agreed}
          nudge={nudge}
          onAgreedChange={handleAgreedChange}
          onConfirm={confirm}
          onBlocked={handleBlocked}
          onDismiss={closeReopen}
          titleId={titleId}
          bodyId={bodyId}
          dialogRef={dialogRef}
          checkboxRef={checkboxRef}
        />
      ) : null}
    </DisclaimerContext.Provider>
  )
}
