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

export function DisclaimerReopenButton({ className }) {
  const { reopen } = useDisclaimer()
  return (
    <button type="button" className={className} onClick={reopen}>
      Disclaimer
    </button>
  )
}

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

export default function DisclaimerGate({ children }) {
  const { pathname } = useLocation()
  const titleId = useId()
  const bodyId = useId()
  const dialogRef = useRef(null)
  const checkboxRef = useRef(null)
  const restoreFocusRef = useRef(null)
  const nudgeTimerRef = useRef(null)
  const [record, setRecord] = useState(() => readAcknowledgement())
  const [reopen, setReopen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [nudge, setNudge] = useState(false)
  const excluded = isDisclaimerExcludedPath(pathname)
  const mode = reopen ? 'reopen' : 'gate'
  const open = shouldShowDisclaimer({ pathname, record, reopen })

  const closeReopen = useCallback(() => {
    setReopen(false)
    setAgreed(false)
    setNudge(false)
  }, [])

  const handleAgreedChange = useCallback((checked) => {
    setAgreed(checked)
    if (checked) setNudge(false)
  }, [])

  const handleBlocked = useCallback(() => {
    setNudge(true)
    checkboxRef.current?.focus()
    window.clearTimeout(nudgeTimerRef.current)
    nudgeTimerRef.current = window.setTimeout(() => setNudge(false), 1200)
  }, [])

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

  const handleReopen = useCallback(() => {
    if (excluded) return
    restoreFocusRef.current = document.activeElement
    setAgreed(true)
    setReopen(true)
  }, [excluded])

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

  useEffect(() => {
    if (open) return undefined
    const target = restoreFocusRef.current
    restoreFocusRef.current = null
    if (target && typeof target.focus === 'function') {
      target.focus()
    }
    return undefined
  }, [open])

  useEffect(
    () => () => {
      document.body.style.overflow = ''
      window.clearTimeout(nudgeTimerRef.current)
    },
    [],
  )

  return (
    <DisclaimerContext.Provider value={{ reopen: handleReopen, isOpen: open }}>
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
