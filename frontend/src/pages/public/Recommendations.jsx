import PageHeader from '../../components/shared/PageHeader'
import { ndrrmpPillars, recommendationsByCategory } from '../../data/siteContent'

export default function Recommendations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommendations"
        subtitle="Planning and preparedness guidance grouped by risk category"
      />
      {Object.entries(recommendationsByCategory).map(([category, items]) => (
        <section key={category} className="card-surface p-5">
          <h2 className="font-display text-lg font-semibold text-foundation">
            {category} risk
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ocean">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foundation">
          NDRRMP thematic pillars
        </h2>
        <div className="card-surface overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">NDRRMP 2020–2030 pillars and lead agencies</caption>
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 font-semibold text-foundation">Pillar</th>
                <th className="px-4 py-3 font-semibold text-foundation">Lead agency</th>
              </tr>
            </thead>
            <tbody>
              {ndrrmpPillars.map((row) => (
                <tr key={row.pillar} className="border-t border-pale/60">
                  <td className="px-4 py-3 text-ocean">{row.pillar}</td>
                  <td className="px-4 py-3 text-ocean">{row.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-ocean">
          These pillars and lead agencies are defined under the National Disaster Risk Reduction and
          Management Plan (NDRRMP) 2020–2030, institutionalized under Republic Act 10121.
        </p>
      </section>

      <p className="text-sm leading-relaxed text-ocean/80">
        These recommendations support planning and preparedness. They are not
        real-time emergency instructions.
      </p>
    </div>
  )
}
