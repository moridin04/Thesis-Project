import PageHeader from '../../components/shared/PageHeader'
import { recommendationsByCategory } from '../../data/mockData'

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
      <p className="text-sm leading-relaxed text-ocean/80">
        These recommendations support planning and preparedness. They are not
        real-time emergency instructions.
      </p>
    </div>
  )
}
