import { useMemo, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useUploadData } from '../../context/UploadDataContext'
import PageHeader from '../../components/shared/PageHeader'

const filters = ['pending', 'approved', 'rejected']

export default function ReviewUploads() {
  const { uploads, approveUpload, rejectUpload, loading, error } = useUploadData()
  const [filter, setFilter] = useState('pending')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  const filtered = useMemo(
    () => uploads.filter((item) => item.status === filter),
    [filter, uploads],
  )

  async function handleApprove(uploadId) {
    setActionError('')
    setBusyId(uploadId)
    try {
      await approveUpload(uploadId)
    } catch (err) {
      setActionError(err?.response?.data?.detail ?? 'Unable to approve upload.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(uploadId) {
    setActionError('')
    setBusyId(uploadId)
    try {
      await rejectUpload(uploadId, rejectReason.trim())
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      setActionError(err?.response?.data?.detail ?? 'Unable to reject upload.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Uploads"
        subtitle="Approve or reject LGU data submissions before they appear publicly."
      />

      {error ? (
        <p className="rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
          {typeof error === 'string' ? error : 'Unable to load uploads.'}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-sm text-[color:var(--color-accent)]">{actionError}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {filters.map((value) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter(value)}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading uploads…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-subtle)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[color:var(--color-tint-soft)] text-ocean">
              <tr>
                <th className="px-4 py-3 font-semibold">Uploader</th>
                <th className="px-4 py-3 font-semibold">Barangay</th>
                <th className="px-4 py-3 font-semibold">Data Type</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                {filter === 'pending' ? (
                  <th className="px-4 py-3 font-semibold">Actions</th>
                ) : (
                  <th className="px-4 py-3 font-semibold">Notes</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted">
                    No {filter} uploads.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-t border-[color:var(--border-subtle)]">
                    <td className="px-4 py-3">{item.uploaderName}</td>
                    <td className="px-4 py-3">{item.barangayName}</td>
                    <td className="px-4 py-3">{item.dataType}</td>
                    <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                    {filter === 'pending' ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-primary disabled:opacity-70"
                            disabled={busyId === item.id}
                            onClick={() => handleApprove(item.id)}
                          >
                            {busyId === item.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              'Approve'
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={busyId === item.id}
                            onClick={() => setRejectingId(item.id)}
                          >
                            Reject
                          </button>
                        </div>
                        {rejectingId === item.id ? (
                          <div className="mt-3 space-y-2">
                            <input
                              className="input-field"
                              placeholder="Rejection reason (optional)"
                              value={rejectReason}
                              onChange={(event) => setRejectReason(event.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-secondary disabled:opacity-70"
                              disabled={busyId === item.id}
                              onClick={() => handleReject(item.id)}
                            >
                              Confirm Reject
                            </button>
                          </div>
                        ) : null}
                      </td>
                    ) : (
                      <td className="px-4 py-3 text-muted">
                        {item.rejectionReason || item.notes || '—'}
                      </td>
                    )}
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
