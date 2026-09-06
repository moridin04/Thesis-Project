import { useMemo, useState } from 'react'
import { useUploadData } from '../../context/UploadDataContext'
import PageHeader from '../../components/shared/PageHeader'

export default function AdminAuditLog() {
  const { auditLogs, loading, error } = useUploadData()
  const [dateFilter, setDateFilter] = useState('')

  const filtered = useMemo(() => {
    if (!dateFilter) return auditLogs
    return auditLogs.filter((entry) => entry.timestamp.slice(0, 10) === dateFilter)
  }, [auditLogs, dateFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Read-only record of uploads, approvals, rejections, and account changes."
      />

      {error ? (
        <p className="rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
          {typeof error === 'string' ? error : 'Unable to load audit log.'}
        </p>
      ) : null}

      <input
        type="date"
        className="input-field-light max-w-xs"
        value={dateFilter}
        onChange={(event) => setDateFilter(event.target.value)}
        aria-label="Filter by date"
      />

      {loading ? (
        <p className="text-sm text-muted">Loading audit entries…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-subtle)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[color:var(--color-tint-soft)] text-ocean">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="border-t border-[color:var(--border-subtle)]">
                  <td className="px-4 py-3">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">{entry.user}</td>
                  <td className="px-4 py-3">{entry.action}</td>
                  <td className="px-4 py-3">{entry.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
