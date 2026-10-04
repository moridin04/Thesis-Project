import { useEffect, useId, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'

export const NEUTRAL_BUTTON_CLASS =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-[1.5px] border-[color:var(--border-subtle)] bg-white px-5 py-3 text-[0.9375rem] font-semibold text-foundation transition-colors hover:bg-[color:var(--color-tint-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClassName = 'btn-approve',
  requireReason = false,
  reasonLabel = 'Reason',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState('')
  const titleId = useId()
  const reasonId = useId()
  const firstFieldRef = useRef(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [busy, onCancel])

  const trimmed = reason.trim()
  const canConfirm = !busy && (!requireReason || trimmed.length > 0)

  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center bg-[color:var(--color-darkest)]/40 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-surface w-full max-w-md space-y-4 p-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (canConfirm) onConfirm(trimmed)
        }}
      >
        <h2 id={titleId} className="font-display text-lg font-semibold text-heading">
          {title}
        </h2>
        {message ? <p className="text-sm text-body">{message}</p> : null}
        {requireReason ? (
          <label htmlFor={reasonId} className="block space-y-1.5 text-sm font-medium text-foundation">
            <span>{reasonLabel} (required)</span>
            <textarea
              id={reasonId}
              ref={firstFieldRef}
              className="input-field-light min-h-24"
              value={reason}
              required
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        ) : null}
        {error ? <p className="text-sm text-[color:var(--color-accent)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            ref={requireReason ? undefined : firstFieldRef}
            className={NEUTRAL_BUTTON_CLASS}
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className={confirmClassName} disabled={!canConfirm}>
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
