import { useParams } from 'react-router-dom'
import PageHeader from '../../components/shared/PageHeader'
import RiskBadge from '../../components/shared/RiskBadge'
import { useApprovedBarangays } from '../../hooks/useApprovedBarangays'

export default function BarangayProfile() {
  const { id } = useParams()
  const priorityBarangays = useApprovedBarangays()
  const profile =
    priorityBarangays.find(
      (row) => row.barangay.toLowerCase().replace(/\s+/g, '-') === id,
    ) ?? priorityBarangays[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.barangay}
        subtitle={`${profile.district} · Barangay risk profile`}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-surface p-4">
          <p className="text-xs text-ocean">Risk score</p>
          <p className="mt-1 text-2xl font-semibold text-foundation">
            {(profile.dpi * 100).toFixed(0)}%
          </p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs text-ocean">Category</p>
          <div className="mt-2">
            <RiskBadge category={profile.riskLevel} />
          </div>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs text-ocean">Population</p>
          <p className="mt-1 text-2xl font-semibold text-foundation">
            {profile.population.toLocaleString()}
          </p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs text-ocean">Flood depth</p>
          <p className="mt-1 text-2xl font-semibold text-foundation">
            {profile.floodDepthM.toFixed(1)} m
          </p>
        </div>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="font-display text-lg font-semibold text-foundation">
            Hazard indicators
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ocean">
            <li>Flood depth: {profile.floodDepthM.toFixed(1)} m</li>
            <li>Rainfall exposure index: high</li>
          </ul>
        </div>
        <div className="card-surface p-5">
          <h2 className="font-display text-lg font-semibold text-foundation">
            Recommended preparedness
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ocean">
            <li>Review barangay evacuation routes before heavy rainfall.</li>
            <li>Coordinate with local disaster response teams.</li>
            <li>Monitor official advisories from authorized agencies.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
