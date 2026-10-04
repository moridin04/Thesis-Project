import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { useUploadData } from '../../context/UploadDataContext'
import PageHeader from '../../components/shared/PageHeader'
import { UPLOAD_DATA_TYPES, dataTypeLabel } from '../../utils/uploadDataTypes'

const statusStyles = {
  pending: 'upload-badge upload-badge--pending',
  approved: 'upload-badge upload-badge--approved',
  rejected: 'upload-badge upload-badge--rejected',
}

export default function DashboardUpload() {
  const { account } = useAuth()
  const { submitUpload, uploadsForUser, loading, error } = useUploadData()
  const [barangayName, setBarangayName] = useState('')
  const [dataType, setDataType] = useState(UPLOAD_DATA_TYPES[0].value)
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const myUploads = uploadsForUser(account?.id)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitError('')
    setSubmitting(true)
    try {
      await submitUpload({
        barangayName: barangayName.trim(),
        dataType,
        notes: notes.trim(),
        file,
      })
      setBarangayName('')
      setNotes('')
      setFile(null)
      event.target.reset()
      setMessage('Upload submitted for administrator review.')
    } catch (err) {
      setSubmitError(err?.response?.data?.detail ?? 'Unable to submit upload.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upload Data"
        subtitle="Submit barangay datasets for review before they appear on public maps and rankings."
      />

      {error ? (
        <p className="rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
          {typeof error === 'string' ? error : 'Unable to load upload history.'}
        </p>
      ) : null}

      <form className="card-surface max-w-2xl space-y-4 rounded-2xl p-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="upload-file" className="mb-1.5 block text-sm font-medium text-ocean">
            Data File
          </label>
          <input
            id="upload-file"
            type="file"
            className="input-field file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--color-tint-soft)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div>
          <label htmlFor="barangay-name" className="mb-1.5 block text-sm font-medium text-ocean">
            Barangay Name
          </label>
          <input
            id="barangay-name"
            className="input-field"
            value={barangayName}
            onChange={(event) => setBarangayName(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="data-type" className="mb-1.5 block text-sm font-medium text-ocean">
            Data Type
          </label>
          <select
            id="data-type"
            className="input-field"
            value={dataType}
            onChange={(event) => setDataType(event.target.value)}
          >
            {UPLOAD_DATA_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="upload-notes" className="mb-1.5 block text-sm font-medium text-ocean">
            Notes
          </label>
          <textarea
            id="upload-notes"
            className="input-field min-h-24"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Source, collection date, or validation notes"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-70">
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Submit for Approval
        </button>
        {submitError ? <p className="text-sm text-[color:var(--color-accent)]">{submitError}</p> : null}
        {message ? <p className="text-sm text-ocean">{message}</p> : null}
      </form>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-heading">Your Upload History</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading uploads…</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-subtle)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[color:var(--color-tint-soft)] text-ocean">
                <tr>
                  <th className="px-4 py-3 font-semibold">Barangay</th>
                  <th className="px-4 py-3 font-semibold">Data Type</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {myUploads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-muted">
                      No uploads yet.
                    </td>
                  </tr>
                ) : (
                  myUploads.map((item) => (
                    <tr key={item.id} className="border-t border-[color:var(--border-subtle)]">
                      <td className="px-4 py-3">{item.barangayName}</td>
                      <td className="px-4 py-3">{dataTypeLabel(item.dataType)}</td>
                      <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={statusStyles[item.status]}>
                          {item.status}
                        </span>
                        {item.status === 'rejected' && item.rejectionReason ? (
                          <p className="mt-1 text-xs text-muted">{item.rejectionReason}</p>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
