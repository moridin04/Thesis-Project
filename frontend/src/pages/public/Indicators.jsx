// Catalog of hazard, exposure, and vulnerability indicators.
// App.jsx mounts this at /indicators inside PublicLayout.
// The staff dashboard reuses it at /dashboard/indicators.
// Section text comes from indicatorSections in siteContent. No API call.
import PageHeader from '../../components/shared/PageHeader'
import { dpiAggregationNote, indicatorSections } from '../../data/siteContent'

/* Shared by every section so columns line up across tables. Indicator fits "Elevation_Mean (reverse-normalized)"
   on one line; below the min width each table scrolls inside its card instead of reflowing. */
const TABLE_CLASS = 'w-full min-w-[42rem] table-fixed text-left text-sm'
const COLUMN_WIDTHS = ['w-[18.5rem]', 'w-[30%]', '']

// One table per group, under the DPI note from siteContent.
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
          {/* Inline-size containment keeps the table's min width from widening the shrink-to-fit public <main>. */}
          <div className="card-surface overflow-x-auto [contain:inline-size]">
            <table className={TABLE_CLASS}>
              <colgroup>
                {COLUMN_WIDTHS.map((width, index) => (
                  <col key={index} className={width} />
                ))}
              </colgroup>
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
                    <td className="break-words px-4 py-3 text-ocean">{row.formula}</td>
                    <td className="break-words px-4 py-3 text-ocean">{row.description}</td>
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
