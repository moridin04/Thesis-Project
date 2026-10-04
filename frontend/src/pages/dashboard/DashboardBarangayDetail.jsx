import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BackLink from '../../components/shared/BackLink'
import PageHeader from '../../components/shared/PageHeader'
import RiskBadge from '../../components/shared/RiskBadge'
import MlAgreementBadge from '../../components/staff/MlAgreementBadge'
import { IN_SAMPLE_NOTE } from '../../components/staff/mlNotes'
import { fetchStaffBarangayMl } from '../../services/staffService'

export default function DashboardBarangayDetail() {
  const { id } = useParams()
  const [result, setResult] = useState({ id: null, record: null, error: '' })

  useEffect(() => {
    let active = true
    fetchStaffBarangayMl(id)
      .then((record) => {
        if (active) setResult({ id, record, error: '' })
      })
      .catch((err) => {
        if (!active) return
        const message =
          err?.response?.status === 404
            ? 'Barangay not found.'
            : 'Unable to load the model prediction. Check that the API is running.'
        setResult({ id, record: null, error: message })
      })
    return () => {
      active = false
    }
  }, [id])

  const loading = result.id !== id
  const record = loading ? null : result.record

  return (
    <div className="space-y-6">
      <div>
        <BackLink to="/dashboard/barangays">Back to barangays</BackLink>
        <PageHeader title={record?.barangay ?? id} subtitle="DPI class and model-predicted class (staff only)" />
      </div>
      {loading ? <p className="text-sm text-ocean">Loading…</p> : null}
      {!loading && result.error ? <p className="text-sm text-accent">{result.error}</p> : null}
      {record ? (
        <section className="card-surface space-y-4 p-5">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">DPI class</dt>
              <dd className="mt-1">
                <RiskBadge category={record.dpiRiskClass} />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Model-predicted class</dt>
              <dd className="mt-1">
                <RiskBadge category={record.mlPredictedRiskClass} />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Confidence</dt>
              <dd className="mt-1 font-semibold tabular-nums text-foundation">
                {record.mlPredictionConfidence == null
                  ? '—'
                  : `${(record.mlPredictionConfidence * 100).toFixed(1)}%`}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Agreement</dt>
              <dd className="mt-1">
                <MlAgreementBadge agrees={record.agreesWithDpi} />
              </dd>
            </div>
          </dl>
          <p className="disclaimer-soft px-4 py-3 text-sm leading-relaxed">{IN_SAMPLE_NOTE}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/dashboard/model-results" className="font-medium text-ocean hover:text-action">
              Held-out model results
            </Link>
            <Link
              to={`/barangays/${encodeURIComponent(record.id)}`}
              className="font-medium text-ocean hover:text-action"
            >
              Public barangay profile
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
