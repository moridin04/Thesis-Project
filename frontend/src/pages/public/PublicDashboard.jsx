import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, SearchX, ShieldAlert, Users, Waves } from 'lucide-react'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import RiskDistributionChart from '../../components/charts/RiskDistributionChart'
import TopBarangaysChart from '../../components/charts/TopBarangaysChart'
import PriorityBarangaysTable from '../../components/tables/PriorityBarangaysTable'
import { usePublicBarangays } from '../../hooks/usePublicBarangays'
import { fetchPublicOverview } from '../../services/publicService'
import { riskColors } from '../../theme/colors'

const LEVELS = ['High', 'Medium', 'Low']
const TOP_OPTIONS = [5, 10, 20]
const DEFAULT_TOP = 5
const FILTER_KEYS = ['q', 'district', 'priority', 'top']

function formatCompact(n) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function countLevel(rows, level) {
  return rows.filter((row) => row.riskLevel === level).length
}

export default function PublicDashboard() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { rows: barangays, loading: barangaysLoading, error: barangaysError } = usePublicBarangays()
  const [searchParams, setSearchParams] = useSearchParams()

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

  const query = searchParams.get('q') ?? ''
  const district = searchParams.get('district') ?? ''
  const priorityParam = searchParams.get('priority') ?? ''
  const priority = LEVELS.includes(priorityParam) ? priorityParam : ''
  const topParam = Number(searchParams.get('top'))
  const top = TOP_OPTIONS.includes(topParam) ? topParam : DEFAULT_TOP

  const filtersActive = Boolean(query.trim() || district || priority)
  const changed = Boolean(query || district || priority || top !== DEFAULT_TOP)

  function setParam(key, value) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (!value || (key === 'top' && Number(value) === DEFAULT_TOP)) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  function resetFilters() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        FILTER_KEYS.forEach((key) => next.delete(key))
        return next
      },
      { replace: true },
    )
  }

  function togglePriority(level) {
    setParam('priority', priority === level ? '' : level)
  }

  const districts = useMemo(
    () => [...new Set(barangays.map((row) => row.district).filter(Boolean))].sort(),
    [barangays],
  )

  const baseRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return barangays
      .filter(
        (row) =>
          (!needle || row.barangay.toLowerCase().includes(needle)) &&
          (!district || row.district === district),
      )
      .sort((a, b) => b.priorityScore - a.priorityScore)
  }, [barangays, query, district])

  const filtered = useMemo(
    () => (priority ? baseRows.filter((row) => row.riskLevel === priority) : baseRows),
    [baseRows, priority],
  )

  const topRows = filtered.slice(0, top)
  const totalCount = barangays.length
  const population = filtered.reduce((sum, row) => sum + row.population, 0)

  const distribution = LEVELS.map((level) => ({
    name: level,
    value: countLevel(baseRows, level),
    color: riskColors[level] || 'var(--color-pale)',
  }))

  const isLoading = loading || barangaysLoading
  const loadError = error || barangaysError
  const ready = !isLoading && !loadError && barangays.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manila Flood Priority Overview"
        subtitle="How Manila's barangays compare on flood priority, based on published AGOS outputs"
      />
      {isLoading ? <p className="text-sm text-ocean">Loading overview…</p> : null}
      {loadError ? <p className="text-sm text-accent">{loadError}</p> : null}
      {ready ? (
        <>
          {overview ? <p className="text-sm text-ocean">Dataset {overview.dataset_version}</p> : null}

          <section aria-label="Filters" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
              <label className="block text-xs font-medium text-ocean">
                Search barangay
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setParam('q', event.target.value)}
                  placeholder="Search barangay…"
                  className="input-field-light mt-1 w-full"
                />
              </label>
              <label className="block text-xs font-medium text-ocean">
                District
                <select
                  value={district}
                  onChange={(event) => setParam('district', event.target.value)}
                  className="input-field-light mt-1 w-full"
                >
                  <option value="">All districts</option>
                  {districts.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-ocean">
                Priority level
                <select
                  value={priority}
                  onChange={(event) => setParam('priority', event.target.value)}
                  className="input-field-light mt-1 w-full"
                >
                  <option value="">All priority levels</option>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level} Priority
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-ocean">
                Show top
                <select
                  value={top}
                  onChange={(event) => setParam('top', event.target.value)}
                  className="input-field-light mt-1 w-full"
                >
                  {TOP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!changed}
                className="rounded-lg border border-pale px-3 py-2 text-sm text-foundation disabled:opacity-40"
              >
                Reset filters
              </button>
            </div>
            <p className="text-sm text-ocean" aria-live="polite">
              Showing {filtered.length.toLocaleString()} of {totalCount.toLocaleString()} barangays
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Barangays analyzed"
              value={filtered.length.toLocaleString()}
              hint={filtersActive ? `of ${totalCount.toLocaleString()} total` : undefined}
              icon={Building2}
              tone="slate"
            />
            <StatCard
              label="High priority"
              value={countLevel(filtered, 'High').toLocaleString()}
              icon={ShieldAlert}
              tone="rose"
            />
            <StatCard
              label="Medium priority"
              value={countLevel(filtered, 'Medium').toLocaleString()}
              icon={Waves}
              tone="sky"
            />
            <StatCard
              label="Population (2024)"
              value={formatCompact(population)}
              icon={Users}
              tone="teal"
            />
          </section>

          {filtered.length === 0 ? (
            <section className="card-surface flex flex-col items-center gap-3 rounded-2xl px-5 py-12 text-center">
              <SearchX className="h-8 w-8 text-ocean" aria-hidden />
              <p className="font-display text-lg font-semibold text-foundation">No barangays match these filters</p>
              <p className="text-sm text-ocean">Try a different search, district or priority level.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-pale px-3 py-2 text-sm text-foundation hover:bg-pale/40"
              >
                Reset filters
              </button>
            </section>
          ) : (
            <>
              <section className="grid gap-6 xl:grid-cols-5">
                <div className="card-surface min-w-0 rounded-2xl p-5 xl:col-span-2">
                  <h2 className="mb-4 font-display text-lg font-semibold text-foundation">
                    Priority distribution
                  </h2>
                  <RiskDistributionChart
                    data={distribution}
                    centerTotal={filtered.length}
                    selected={priority}
                    onSelect={togglePriority}
                  />
                </div>
                <div className="card-surface min-w-0 rounded-2xl p-5 xl:col-span-3">
                  <h2 className="mb-4 font-display text-lg font-semibold text-foundation">
                    Highest DPI barangays
                  </h2>
                  <TopBarangaysChart key={`${query}|${district}|${priority}|${top}`} rows={topRows} />
                </div>
              </section>

              <section className="card-surface min-w-0 rounded-2xl p-5">
                <h2 className="mb-4 font-display text-lg font-semibold text-foundation">
                  Top {topRows.length} priority barangays
                </h2>
                <PriorityBarangaysTable rows={topRows} />
              </section>
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
