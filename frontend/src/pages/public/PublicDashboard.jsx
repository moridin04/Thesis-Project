import { Building2, ShieldAlert, Users, Waves } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import TopBarangaysChart from '../../components/charts/TopBarangaysChart'
import PriorityBarangaysTable from '../../components/tables/PriorityBarangaysTable'
import {
  datasetMeta,
  overviewStats,
  riskDistribution,
  topBarangaysByDpi,
} from '../../data/mockData'
import { useApprovedBarangays } from '../../hooks/useApprovedBarangays'

function formatCompact(n) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export default function PublicDashboard() {
  const priorityBarangays = useApprovedBarangays()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Dashboard"
        subtitle="City-wide flood risk overview for published SAGIP outputs"
      />
      <p className="disclaimer-soft px-4 py-3 text-sm leading-relaxed">
        Mock data shown for thesis prototype demonstration. Dataset version{' '}
        {datasetMeta.version} · Last update {datasetMeta.lastUpdated}.
      </p>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Barangays analyzed"
          value={overviewStats.totalBarangays.toLocaleString()}
          icon={Building2}
          tone="slate"
        />
        <StatCard
          label="High / critical risk"
          value={overviewStats.highRiskCount.toLocaleString()}
          icon={ShieldAlert}
          tone="rose"
        />
        <StatCard
          label="Moderate risk"
          value="287"
          icon={Waves}
          tone="sky"
        />
        <StatCard
          label="Estimated exposed population"
          value={formatCompact(overviewStats.affectedPopulation)}
          icon={Users}
          tone="teal"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="card-surface rounded-2xl p-5 xl:col-span-2">
          <h2 className="font-display text-lg font-semibold text-foundation">
            Risk distribution
          </h2>
          <RiskDistributionChart data={riskDistribution} />
        </div>
        <div className="card-surface rounded-2xl p-5 xl:col-span-3">
          <h2 className="mb-4 font-display text-lg font-semibold text-foundation">
            Priority barangays by risk score
          </h2>
          <TopBarangaysChart data={topBarangaysByDpi} />
        </div>
      </section>

      <section className="card-surface rounded-2xl p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-foundation">
          Priority barangay ranking
        </h2>
        <PriorityBarangaysTable rows={priorityBarangays} />
      </section>
    </div>
  )
}
