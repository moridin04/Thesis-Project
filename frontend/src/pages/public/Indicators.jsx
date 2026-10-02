import PageHeader from '../../components/shared/PageHeader'
import { dpiAggregationNote, indicatorSections } from '../../data/siteContent'

export default function Indicators() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Indicators"
        subtitle="Hazard, exposure, and vulnerability variables used in the Disaster Prioritization Index"
      />
      <p className="text-sm leading-relaxed text-ocean">{dpiAggregationNote}</p>
      {indicatorSections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foundation">{section.title}</h2>
          {section.note ? <p className="text-sm text-ocean">{section.note}</p> : null}
          <div className="card-surface overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foundation">Indicator</th>
                  <th className="px-4 py-3 font-semibold text-foundation">Formula</th>
                  <th className="px-4 py-3 font-semibold text-foundation">Description</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.indicator} className="border-t border-pale/60">
                    <td className="px-4 py-3 font-medium text-foundation">{row.indicator}</td>
                    <td className="px-4 py-3 text-ocean">{row.formula}</td>
                    <td className="px-4 py-3 text-ocean">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
