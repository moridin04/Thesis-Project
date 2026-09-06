import PageHeader from '../../components/shared/PageHeader'
import { indicatorsCatalog } from '../../data/mockData'

export default function Indicators() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicators"
        subtitle="Plain-language descriptions of hazard, exposure, and vulnerability features"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {indicatorsCatalog.map((indicator) => (
          <article key={indicator.name} className="card-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-action">
              {indicator.category}
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-foundation">
              {indicator.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ocean">
              {indicator.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
