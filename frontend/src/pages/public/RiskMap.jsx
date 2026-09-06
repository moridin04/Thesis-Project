import { Link } from 'react-router-dom'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import RiskBadge from '../../components/shared/RiskBadge'
import { useApprovedBarangays } from '../../hooks/useApprovedBarangays'
import { riskLegend } from '../../theme/colors'

export default function RiskMap() {
  const priorityBarangays = useApprovedBarangays()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Map"
        subtitle="Interactive Manila barangay map colored by published risk category"
      />
      <div className="card-surface p-5">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search barangay…"
            className="input-field-light max-w-xs"
            aria-label="Search barangay"
          />
          <select
            className="input-field-light max-w-xs"
            aria-label="Filter by risk category"
          >
            <option>All risk categories</option>
            <option>Critical</option>
            <option>High</option>
            <option>Moderate</option>
            <option>Low</option>
          </select>
        </div>
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-pale bg-surface">
          <EmptyState
            title="Map canvas placeholder"
            description="Leaflet map integration will render published barangay polygons here. Use Rankings below to open barangay profiles meanwhile."
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-ocean">
          {riskLegend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {priorityBarangays.slice(0, 4).map((row) => (
          <Link
            key={row.id}
            to={`/barangays/${row.barangay.toLowerCase().replace(/\s+/g, '-')}`}
            className="card-surface p-4 transition hover:border-action/50"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foundation">{row.barangay}</p>
                <p className="text-sm text-ocean">{row.district}</p>
              </div>
              <RiskBadge category={row.riskLevel} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
