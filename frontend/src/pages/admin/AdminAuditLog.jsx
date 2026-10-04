// Read-only log of uploads, exports, reports, and account changes.
// App.jsx mounts this at /admin/audit-log. Only admin can enter.
// Rows come from fetchAuditLogs in adminService.
// Date and action-group filters are sent with each request.
import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import { fetchAuditLogs } from '../../services/adminService'
import {
  AUDIT_ACTION_GROUPS,
  auditActionLabel,
  auditLogParams,
  hasMoreAuditRows,
} from '../../utils/auditLog'

const LOAD_ERROR = 'Unable to load audit log.'

// Manila local time. A value that is not a date is shown unchanged.
function formatTimestamp(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
}

// Filterable table. This page has no control that edits an entry.
export default function AdminAuditLog() {
  const [filters, setFilters] = useState({ group: '', date: '' })
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchAuditLogs(auditLogParams(filters))
      .then((rows) => {
        if (!active) return
        setEntries(rows)
        setHasMore(hasMoreAuditRows(rows.length))
        setError('')
      })
      .catch(() => active && setError(LOAD_ERROR))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [filters])

  // Changing a filter reloads from the first row.
  function updateFilter(key, value) {
    setLoading(true)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  // offset skips rows already shown. Each request asks for at most 50.
  // hasMore stays on when that response was a full page of 50.
  async function loadMore() {
    setLoadingMore(true)
    try {
      const rows = await fetchAuditLogs(auditLogParams({ ...filters, offset: entries.length }))
      setEntries((current) => [...current, ...rows])
      setHasMore(hasMoreAuditRows(rows.length))
    } catch {
      setError(LOAD_ERROR)
    } finally {
      setLoadingMore(false)
    }
  }

  const filtered = Boolean(filters.group || filters.date)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Read-only record of uploads, exports, reports, and account changes. Entries cannot be edited or deleted."
      />

      {error ? (
        <p className="rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,12rem)]">
        <input
          type="date"
          className="input-field-light"
          value={filters.date}
          onChange={(event) => updateFilter('date', event.target.value)}
          aria-label="Filter by date"
        />
        <select
          className="input-field-light"
          value={filters.group}
          onChange={(event) => updateFilter('group', event.target.value)}
          aria-label="Filter by action"
        >
          {AUDIT_ACTION_GROUPS.map((group) => (
            <option key={group.value || 'all'} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading audit entries…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-subtle)]">
        <table className="min-w-[44rem] w-full text-left text-sm">
          <thead className="bg-[color:var(--color-tint-soft)] text-ocean">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  {filtered ? 'No audit entries match these filters.' : 'No audit entries yet.'}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t border-[color:var(--border-subtle)]">
                  <td className="whitespace-nowrap px-4 py-3">{formatTimestamp(entry.timestamp)}</td>
                  <td className="px-4 py-3">{entry.user}</td>
                  <td className="whitespace-nowrap px-4 py-3" title={entry.action}>
                    {auditActionLabel(entry.action)}
                  </td>
                  <td className="px-4 py-3">{entry.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      )}

      {!loading && hasMore ? (
        <button type="button" className="btn-secondary" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Load more
        </button>
      ) : null}
    </div>
  )
}
