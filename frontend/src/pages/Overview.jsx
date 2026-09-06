import {
  BrainCircuit,
  Building2,
  ShieldAlert,
  Users,
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import TopBarangaysChart from '../components/charts/TopBarangaysChart'
import PriorityBarangaysTable from '../components/tables/PriorityBarangaysTable'
import {
  overviewStats,
  priorityBarangays,
  riskDistribution,
  topBarangaysByDpi,
} from '../data/mockOverview'

function formatCompact(n) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

export default function Overview() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total barangays"
          value={overviewStats.totalBarangays.toLocaleString()}
          hint="City of Manila coverage"
          icon={Building2}
          tone="slate"
        />
        <StatCard
          label="High / critical risk"
          value={overviewStats.highRiskCount.toLocaleString()}
          delta="+8 vs last month"
          deltaPositive={false}
          hint="priority zones"
          icon={ShieldAlert}
          tone="rose"
        />
        <StatCard
          label="Affected population"
          value={formatCompact(overviewStats.affectedPopulation)}
          delta="+2.1% seasonal"
          deltaPositive={false}
          hint="est. exposure"
          icon={Users}
          tone="sky"
        />
        <StatCard
          label="Best model F1"
          value={overviewStats.bestModelF1.toFixed(3)}
          delta="+0.018 vs baseline"
          deltaPositive
          hint="XGBoost ensemble"
          icon={BrainCircuit}
          tone="teal"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-2">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Risk distribution
            </h2>
            <p className="text-sm text-slate-500">
              Barangays by predicted flood risk class
            </p>
          </div>
          <RiskDistributionChart data={riskDistribution} />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Top barangays by DPI
            </h2>
            <p className="text-sm text-slate-500">
              Disaster Priority Index · highest exposure first
            </p>
          </div>
          <TopBarangaysChart data={topBarangaysByDpi} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Priority barangays
            </h2>
            <p className="text-sm text-slate-500">
              Ranked for response planning · mock snapshot
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {priorityBarangays.length} listed
          </span>
        </div>
        <PriorityBarangaysTable rows={priorityBarangays} />
      </section>
    </div>
  )
}
