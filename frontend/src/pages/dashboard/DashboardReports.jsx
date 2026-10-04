// Internal PDF report for staff and admin.
// App.jsx mounts this at /dashboard/reports for those two roles.
// Details and the file come from reportService.
// Regenerating the PDF is limited to the admin role.
import { useCallback, useEffect, useState } from 'react'
import { Download, FileText, Info, LoaderCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import PageHeader from '../../components/shared/PageHeader'
import { canRegenerateReport } from '../../config/dashboardNav'
import {
  fetchComprehensiveReportMeta,
  fetchComprehensiveReportPdf,
  regenerateComprehensiveReport,
  saveBlob,
} from '../../services/reportService'
import {
  REPORT_DESCRIPTION,
  REPORT_NOTE,
  REPORT_TITLE,
  formatFileSize,
  formatGeneratedAt,
  reportFilename,
} from '../../utils/comprehensiveReport'

// Uses the API error text when it is a string. Otherwise the fallback.
function errorMessage(err, fallback) {
  const detail = err?.response?.data?.detail
  return typeof detail === 'string' ? detail : fallback
}

// One metadata label and its value.
function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-foundation">{value || '—'}</dd>
    </div>
  )
}

// Download builds the PDF when none is cached yet.
export default function DashboardReports() {
  const { account } = useAuth()
  // True only when the signed-in role is admin.
  const isAdmin = canRegenerateReport(account?.role)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState('')

  // Stores the metadata, or the load error, from one request.
  const applyLoad = useCallback((request) => {
    return request
      .then((data) => {
        setMeta(data)
        setLoadError('')
      })
      .catch((err) => setLoadError(errorMessage(err, 'Unable to load the report details.')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    applyLoad(fetchComprehensiveReportMeta())
  }, [applyLoad])

  // Asks again for the report metadata.
  function retry() {
    setLoading(true)
    applyLoad(fetchComprehensiveReportMeta())
  }

  // Downloads the PDF and refreshes the metadata shown on the page.
  async function handleDownload() {
    setDownloading(true)
    setActionError('')
    try {
      const blob = await fetchComprehensiveReportPdf()
      const latest = await fetchComprehensiveReportMeta()
      setMeta(latest)
      saveBlob(blob, reportFilename(latest.generated_at))
    } catch (err) {
      setActionError(errorMessage(err, 'Unable to download the report. Please try again.'))
    } finally {
      setDownloading(false)
    }
  }

  // Rebuilds the PDF after the confirm dialog. Admin only reaches this.
  async function handleRegenerate() {
    setRegenerating(true)
    setRegenerateError('')
    try {
      setMeta(await regenerateComprehensiveReport())
      setConfirming(false)
    } catch (err) {
      setRegenerateError(errorMessage(err, 'Unable to regenerate the report.'))
    } finally {
      setRegenerating(false)
    }
  }

  // Closes the confirm dialog and clears its error.
  const closeDialog = useCallback(() => {
    setConfirming(false)
    setRegenerateError('')
  }, [])

  const generating = regenerating || (downloading && meta && !meta.available)
  const busy = downloading || regenerating

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Internal reports for LGU staff and administrators" />

      {loading ? (
        <div className="card-surface flex max-w-3xl items-center gap-3 p-6 text-sm text-body" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin text-[color:var(--color-primary)]" aria-hidden />
          Loading report details…
        </div>
      ) : loadError ? (
        <div className="card-surface max-w-3xl space-y-4 p-6" role="alert">
          <p className="text-sm text-foundation">{loadError}</p>
          <button type="button" className="btn-secondary" onClick={retry}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </button>
        </div>
      ) : (
        <article className="card-surface max-w-3xl space-y-5 p-6">
          <div className="flex items-start gap-4">
            <div className="icon-badge h-11 w-11 shrink-0">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-heading">{REPORT_TITLE}</h2>
              <p className="mt-1 text-sm leading-relaxed text-body">{REPORT_DESCRIPTION}</p>
            </div>
          </div>

          {meta?.available ? (
            <dl className="grid grid-cols-1 gap-4 rounded-xl border border-[color:var(--border-subtle)] px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
              <Fact label="Generated" value={formatGeneratedAt(meta.generated_at)} />
              <Fact label="Data version" value={meta.data_version} />
              <Fact label="Pages" value={meta.page_count ? String(meta.page_count) : ''} />
              <Fact label="File size" value={formatFileSize(meta.file_size)} />
            </dl>
          ) : (
            <p className="rounded-xl border border-dashed border-[color:var(--border-subtle)] px-4 py-3 text-sm text-body">
              No report has been generated for the current data version
              {meta?.data_version ? ` (${meta.data_version})` : ''} yet. Downloading will generate it, which takes a few
              seconds.
            </p>
          )}

          <p className="flex items-start gap-2 text-sm text-body">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
            {REPORT_NOTE}
          </p>

          {generating ? (
            <p className="flex items-center gap-2 text-sm text-foundation" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Generating report…
            </p>
          ) : null}
          {actionError ? <p className="text-sm text-[color:var(--color-accent)]">{actionError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={handleDownload} disabled={busy}>
              {downloading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              Download PDF
            </button>
            {isAdmin ? (
              <button
                type="button"
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setConfirming(true)}
                disabled={busy}
              >
                <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} aria-hidden />
                Regenerate report
              </button>
            ) : null}
          </div>
        </article>
      )}

      {confirming ? (
        <ConfirmDialog
          title="Regenerate report?"
          message="This rebuilds the PDF from the current ML output files and replaces the cached copy. It takes a few seconds."
          confirmLabel="Regenerate"
          confirmClassName="btn-primary"
          busy={regenerating}
          error={regenerateError}
          onConfirm={handleRegenerate}
          onCancel={closeDialog}
        />
      ) : null}
    </div>
  )
}
