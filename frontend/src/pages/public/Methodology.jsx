import PageHeader from '../../components/shared/PageHeader'
import { methodologySections } from '../../data/mockData'
import { BRAND } from '../../auth/config'

export default function Methodology() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Methodology"
        subtitle="Research design, modeling workflow, and responsible-use notes"
      />
      <div className="space-y-4">
        {methodologySections.map((section) => (
          <section key={section.title} className="card-surface p-5">
            <h2 className="font-display text-lg font-semibold text-foundation">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ocean">{section.body}</p>
          </section>
        ))}
      </div>
      <p className="disclaimer-soft px-4 py-3 text-sm leading-relaxed">
        {BRAND.disclaimer}
      </p>
    </div>
  )
}
