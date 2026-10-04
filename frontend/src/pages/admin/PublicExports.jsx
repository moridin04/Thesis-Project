import { Fragment, useCallback, useEffect, useId, useState } from 'react'
import { ChevronDown, ChevronRight, Download, LoaderCircle, Plus } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import ConfirmDialog, { NEUTRAL_BUTTON_CLASS } from '../../components/shared/ConfirmDialog'
import {
  approvePublicExport,
  createPublicExport,
  downloadPublicExportPreview,
  fetchPublicExportAudit,
  fetchPublicExports,
  rejectPublicExport,
  unpublishPublicExport,
  updatePublicExport,
} from '../../services/publicExportService'
import {
  AUDIT_ACTION_LABELS,
  DEFAULT_DISCLAIMER,
  EXPORT_KINDS,
  PUBLIC_EXPORT_COLUMNS,
  STATUS_LABELS,
  formatApprovedDate,
  kindLabel,
  previewFilename,
} from '../../utils/publicExports'

const STATUS_BADGE_CLASSES = {
  draft: 'bg-[color:var(--color-tint-soft)] text-ocean ring-[color:var(--border-blue)]',
  approved:
    'bg-[color-mix(in_srgb,var(--action-approve)_12%,white)] text-[color:var(--action-approve-text)] ring-[color:var(--action-approve)]/40',
  rejected:
    'bg-[color-mix(in_srgb,var(--action-reject)_10%,white)] text-[color:var(--action-reject-text)] ring-[color:var(--action-reject)]/40',
  unpublished: 'bg-white text-muted ring-[color:var(--border-subtle)]',
  superseded: 'bg-white text-muted ring-[color:var(--border-subtle)]',
}

const ROW_LINK_CLASS =
  'link-primary inline-flex min-h-11 items-center whitespace-nowrap rounded-md font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] sm:min-h-0'

const BADGE_BASE = 'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset'

const DIALOGS = {
  approve: {
    title: 'Approve public export?',
    message:
      'A final snapshot is written and served on the public Priority Map. Any approved export of the same type is superseded.',
    confirmLabel: 'Approve',
    confirmClassName: 'btn-approve',
  },
  reject: {
    title: 'Reject this draft?',
    message: 'The draft is closed and cannot be approved later.',
    confirmLabel: 'Reject',
    confirmClassName: 'btn-reject',
    requireReason: true,
    reasonLabel: 'Rejection reason',
  },
  unpublish: {
    title: 'Unpublish this export?',
    message: 'The public download stops immediately. Create and approve a new version to publish again.',
    confirmLabel: 'Unpublish',
    confirmClassName: 'btn-reject',
    requireReason: true,
    reasonLabel: 'Reason for unpublishing',
  },
}

const EMPTY_FORM = {
  kind: 'csv',
  title: '',
  description: '',
  columns: PUBLIC_EXPORT_COLUMNS.map((column) => column.key),
  disclaimer: DEFAULT_DISCLAIMER,
}

function errorMessage(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return fallback
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('en-PH') : ''
}

function ExportForm({ editing, saving, error, onSubmit, onCancel, onPreview }) {
  const [form, setForm] = useState(() =>
    editing
      ? {
          kind: editing.kind,
          title: editing.title,
          description: editing.description ?? '',
          columns: editing.columns,
          disclaimer: editing.disclaimer,
        }
      : EMPTY_FORM,
  )
  const fieldId = useId()
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleColumn = (key) =>
    update('columns', form.columns.includes(key) ? form.columns.filter((item) => item !== key) : [...form.columns, key])

  const valid = form.title.trim() && form.disclaimer.trim() && form.columns.length > 0

  return (
    <form
      className="card-surface max-w-3xl space-y-4 p-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid && !saving) onSubmit(form)
      }}
    >
      <h2 className="font-display text-lg font-semibold text-foundation">
        {editing ? `Edit draft: ${editing.title}` : 'New public export'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label className="block space-y-1.5 text-sm font-medium text-foundation" htmlFor={`${fieldId}-kind`}>
          <span>Type</span>
          <select
            id={`${fieldId}-kind`}
            className="input-field-light"
            value={form.kind}
            disabled={Boolean(editing)}
            onChange={(event) => update('kind', event.target.value)}
          >
            {EXPORT_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-foundation" htmlFor={`${fieldId}-title`}>
          <span>Title</span>
          <input
            id={`${fieldId}-title`}
            className="input-field-light"
            value={form.title}
            maxLength={160}
            required
            onChange={(event) => update('title', event.target.value)}
          />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium text-foundation" htmlFor={`${fieldId}-description`}>
        <span>Description (optional)</span>
        <textarea
          id={`${fieldId}-description`}
          className="input-field-light min-h-20"
          value={form.description}
          maxLength={2000}
          onChange={(event) => update('description', event.target.value)}
        />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foundation">Columns</legend>
        <p className="text-xs text-muted">Only these public fields can be exported.</p>
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {PUBLIC_EXPORT_COLUMNS.map((column) => (
            <label key={column.key} className="flex min-h-11 items-center gap-2 text-sm text-foundation sm:min-h-0">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[color:var(--color-primary)]"
                checked={form.columns.includes(column.key)}
                onChange={() => toggleColumn(column.key)}
              />
              {column.label}
            </label>
          ))}
        </div>
        {form.columns.length === 0 ? (
          <p className="text-sm text-[color:var(--color-accent)]">Select at least one column.</p>
        ) : null}
      </fieldset>
      <label className="block space-y-1.5 text-sm font-medium text-foundation" htmlFor={`${fieldId}-disclaimer`}>
        <span>Disclaimer (required, shown at the top of the file)</span>
        <textarea
          id={`${fieldId}-disclaimer`}
          className="input-field-light min-h-24"
          value={form.disclaimer}
          maxLength={2000}
          required
          onChange={(event) => update('disclaimer', event.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-[color:var(--color-accent)]">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={!valid || saving}>
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Save as draft
        </button>
        {editing ? (
          <button type="button" className={NEUTRAL_BUTTON_CLASS} onClick={() => onPreview(editing)}>
            <Download className="h-4 w-4" aria-hidden />
            Preview download
          </button>
        ) : null}
        <button type="button" className={NEUTRAL_BUTTON_CLASS} disabled={saving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function AuditHistory({ exportId }) {
  const [state, setState] = useState({ loading: true, entries: [], error: '' })

  useEffect(() => {
    let active = true
    fetchPublicExportAudit(exportId)
      .then((entries) => active && setState({ loading: false, entries, error: '' }))
      .catch((err) => active && setState({ loading: false, entries: [], error: errorMessage(err, 'Unable to load history.') }))
    return () => {
      active = false
    }
  }, [exportId])

  if (state.loading) return <p className="text-sm text-muted">Loading history…</p>
  if (state.error) return <p className="text-sm text-[color:var(--color-accent)]">{state.error}</p>
  if (state.entries.length === 0) return <p className="text-sm text-muted">No history yet.</p>

  return (
    <ol className="space-y-2">
      {state.entries.map((entry) => (
        <li key={entry.id} className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
          <span className="tabular-nums text-muted">{formatDateTime(entry.created_at)}</span>
          <span className="font-medium text-foundation">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
          <span className="text-ocean">by {entry.actor_name ?? 'system'}</span>
          {entry.detail?.reason ? <span className="w-full text-body">Reason: {entry.detail.reason}</span> : null}
        </li>
      ))}
    </ol>
  )
}

export default function PublicExports() {
  const [exports, setExports] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formMode, setFormMode] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [historyVersion, setHistoryVersion] = useState(0)
  const [actionError, setActionError] = useState('')

  const applyLoad = useCallback((request) => {
    return request
      .then((data) => {
        setExports(data)
        setLoadError('')
      })
      .catch((err) => setLoadError(errorMessage(err, 'Unable to load public exports.')))
      .finally(() => setLoading(false))
  }, [])

  const load = () => applyLoad(fetchPublicExports())

  useEffect(() => {
    applyLoad(fetchPublicExports())
  }, [applyLoad])

  async function handleSave(form) {
    setSaving(true)
    setFormError('')
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      columns: form.columns,
      disclaimer: form.disclaimer.trim(),
    }
    try {
      if (formMode?.editing) {
        await updatePublicExport(formMode.editing.id, payload)
      } else {
        await createPublicExport({ ...payload, kind: form.kind })
      }
      setFormMode(null)
      setHistoryVersion((value) => value + 1)
      await load()
    } catch (err) {
      setFormError(errorMessage(err, 'Unable to save the export.'))
    } finally {
      setSaving(false)
    }
  }

  async function handlePreview(item) {
    setActionError('')
    try {
      await downloadPublicExportPreview(item.id, previewFilename(item))
      setHistoryVersion((value) => value + 1)
    } catch (err) {
      setActionError(errorMessage(err, 'Unable to download the preview.'))
    }
  }

  async function handleDialogConfirm(reason) {
    const { action, item } = dialog
    setDialogBusy(true)
    setDialogError('')
    try {
      if (action === 'approve') await approvePublicExport(item.id)
      if (action === 'reject') await rejectPublicExport(item.id, reason)
      if (action === 'unpublish') await unpublishPublicExport(item.id, reason)
      setDialog(null)
      setHistoryVersion((value) => value + 1)
      await load()
    } catch (err) {
      setDialogError(errorMessage(err, 'Unable to complete the action.'))
    } finally {
      setDialogBusy(false)
    }
  }

  const closeDialog = useCallback(() => {
    setDialog(null)
    setDialogError('')
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Exports"
        subtitle="Prepare and approve the CSV and report files served by the public Priority Map."
      />

      {loadError ? (
        <p className="rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
          {loadError}
        </p>
      ) : null}
      {actionError ? <p className="text-sm text-[color:var(--color-accent)]">{actionError}</p> : null}

      {formMode ? (
        <ExportForm
          key={formMode.editing?.id ?? 'new'}
          editing={formMode.editing}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onPreview={handlePreview}
          onCancel={() => {
            setFormMode(null)
            setFormError('')
          }}
        />
      ) : (
        <button type="button" className="btn-primary" onClick={() => setFormMode({ editing: null })}>
          <Plus className="h-4 w-4" aria-hidden />
          New export
        </button>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading public exports…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-subtle)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[color:var(--color-tint-soft)] text-ocean">
              <tr>
                <th className="min-w-56 px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Version</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Rows</th>
                <th className="px-4 py-3 font-semibold">Approved</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-muted">
                    No public exports yet. The Priority Map shows “Not yet available” until one is approved.
                  </td>
                </tr>
              ) : (
                exports.map((item) => {
                  const expanded = expandedId === item.id
                  return (
                    <Fragment key={item.id}>
                      <tr className="border-t border-[color:var(--border-subtle)] align-top">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="flex items-start gap-1.5 rounded-md text-left font-medium text-foundation hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
                            aria-expanded={expanded}
                            aria-controls={`export-history-${item.id}`}
                            onClick={() => setExpandedId(expanded ? null : item.id)}
                          >
                            {expanded ? (
                              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            ) : (
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            )}
                            <span>
                              {item.title}
                              <span className="sr-only">, show history</span>
                            </span>
                          </button>
                          {item.status_reason ? (
                            <p className="mt-1 pl-5.5 text-xs text-muted">Reason: {item.status_reason}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{kindLabel(item.kind)}</td>
                        <td className="px-4 py-3 tabular-nums">v{item.version}</td>
                        <td className="px-4 py-3">
                          <span className={`${BADGE_BASE} ${STATUS_BADGE_CLASSES[item.status] ?? STATUS_BADGE_CLASSES.draft}`}>
                            {STATUS_LABELS[item.status] ?? item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{item.row_count ?? '—'}</td>
                        <td className="px-4 py-3">
                          {item.approved_at ? (
                            <>
                              <span className="block whitespace-nowrap">{item.approved_by_name ?? '—'}</span>
                              <span className="block whitespace-nowrap text-xs text-muted">
                                {formatApprovedDate(item.approved_at)}
                              </span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.stale ? (
                            <span
                              className={`${BADGE_BASE} bg-[color:var(--color-priority-medium-soft)] text-[color:var(--color-priority-medium-text)] ring-[color:var(--color-priority-medium-ring)]`}
                              title="The dataset changed after approval. Approve a new version to refresh the public file."
                            >
                              Stale
                            </span>
                          ) : (
                            <span className="text-muted">Current</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-x-4 text-sm">
                            {item.status === 'draft' ? (
                              <button
                                type="button"
                                className={ROW_LINK_CLASS}
                                onClick={() => setFormMode({ editing: item })}
                              >
                                Edit
                              </button>
                            ) : null}
                            <button type="button" className={ROW_LINK_CLASS} onClick={() => handlePreview(item)}>
                              {item.status === 'draft' ? 'Preview download' : 'Download file'}
                            </button>
                          </div>
                          {item.status === 'draft' || item.status === 'approved' ? (
                            <div className="mt-2 flex gap-2">
                              {item.status === 'draft' ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn-approve"
                                    onClick={() => setDialog({ action: 'approve', item })}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-reject"
                                    onClick={() => setDialog({ action: 'reject', item })}
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-reject"
                                  onClick={() => setDialog({ action: 'unpublish', item })}
                                >
                                  Unpublish
                                </button>
                              )}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                      {expanded ? (
                        <tr id={`export-history-${item.id}`} className="bg-[color:var(--color-tint-soft)]/40">
                          <td colSpan={8} className="px-4 py-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ocean">History</p>
                            <AuditHistory key={historyVersion} exportId={item.id} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {dialog ? (
        <ConfirmDialog
          {...DIALOGS[dialog.action]}
          message={`${dialog.item.title} (${kindLabel(dialog.item.kind)} v${dialog.item.version}). ${DIALOGS[dialog.action].message}`}
          busy={dialogBusy}
          error={dialogError}
          onConfirm={handleDialogConfirm}
          onCancel={closeDialog}
        />
      ) : null}
    </div>
  )
}
