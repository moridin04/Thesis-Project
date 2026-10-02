import { useEffect, useState } from 'react'
import { Building2, ShieldAlert, Users, Waves } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import TopBarangaysChart from '../../components/charts/TopBarangaysChart'
import PriorityBarangaysTable from '../../components/tables/PriorityBarangaysTable'
import { fetchPublicOverview } from '../../services/publicService'
import { riskColors } from '../../theme/colors'

function formatCompact(n) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export default function PublicDashboard() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchPublicOverview()
      .then((data) => {
        if (active) setOverview(data)
      })
      .catch(() => {
        if (active) setError('Unable to load the city overview. Check that the API is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const distribution = (overview?.risk_distribution ?? []).map((item) => ({
    name: item.category,
    value: item.count,
    color: riskColors[item.category] || 'var(--color-pale)',
  }))

  const topBarangays = (overview?.priority_barangays ?? []).map((row) => ({
    barangay: row.name,
    priorityScore: row.priority_score,
  }))

  const rankingRows = (overview?.priority_barangays ?? []).map((row) => ({
    id: row.id,
    barangay: row.name,
    district: row.district,
    riskLevel: row.risk_category,
    priorityScore: row.priority_score,
    population: row.population_2024,
    floodPct25yr: row.flood_pct_25yr,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Dashboard"
        subtitle="City-wide flood priority overview for published AGOS outputs"
      />
      {loading ? <p className="text-sm text-ocean">Loading overview…</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {overview ? (
        <>
          <p className="text-sm text-ocean">Dataset {overview.dataset_version}</p>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Barangays analyzed"
              value={overview.total_barangays.toLocaleString()}
              icon={Building2}
              tone="slate"
            />
            <StatCard
              label="High priority"
              value={overview.high_priority_count.toLocaleString()}
              icon={ShieldAlert}
              tone="rose"
            />
            <StatCard
              label="Medium priority"
              value={overview.medium_priority_count.toLocaleString()}
              icon={Waves}
              tone="sky"
            />
            <StatCard
              label="Population (2024)"
              value={formatCompact(overview.estimated_exposed_population)}
              icon={Users}
              tone="teal"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-5">
            <div className="card-surface rounded-2xl p-5 xl:col-span-2">
              <h2 className="font-display text-lg font-semibold text-foundation">
                Priority distribution
              </h2>
              <RiskDistributionChart data={distribution} />
            </div>
            <div className="card-surface rounded-2xl p-5 xl:col-span-3">
              <h2 className="mb-4 font-display text-lg font-semibold text-foundation">
                Highest DPI barangays
              </h2>
              <TopBarangaysChart data={topBarangays} />
            </div>
          </section>

          <section className="card-surface rounded-2xl p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-foundation">
              Top priority barangays
            </h2>
            <PriorityBarangaysTable rows={rankingRows} />
          </section>
        </>
      ) : null}
    </div>
  )
}
