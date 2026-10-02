import PageHeader from '../../components/shared/PageHeader'
import { methodologySections } from '../../data/siteContent'
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
            {section.points ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ocean">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-ocean">{section.body}</p>
            )}
          </section>
        ))}
      </div>
      <p className="disclaimer-soft px-4 py-3 text-sm leading-relaxed">
        {BRAND.disclaimer}
      </p>
    </div>
  )
}
