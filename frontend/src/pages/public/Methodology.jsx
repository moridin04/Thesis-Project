// Methodology page: research design, model notes, and the disclaimer.
// App.jsx mounts this at /methodology inside PublicLayout.
// Section text comes from methodologySections in siteContent.
// One sentence is filled by fetchPublicModelSummary.
import { useEffect, useState } from 'react'
import PageHeader from '../../components/shared/PageHeader'
import { methodologySections } from '../../data/siteContent'
import { BRAND } from '../../auth/config'
import { fetchPublicModelSummary } from '../../services/publicService'

// Loads how many held-out barangays matched the DPI class.
// If the request fails, or the counts are missing, the sentence stays blank.
function useModelSummarySentence() {
  const [sentence, setSentence] = useState('')

  useEffect(() => {
    let active = true
    fetchPublicModelSummary()
      .then((summary) => {
        if (!active || summary?.correct == null || !summary?.n_test) return
        setSentence(
          `On ${summary.n_test} held-out barangays it had not seen, it reproduced the DPI-derived class for ${summary.correct} (${summary.percentage}%).`,
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return sentence
}

// Renders each section. Risk classification can append the model sentence.
export default function Methodology() {
  const summarySentence = useModelSummarySentence()

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
              <p className="mt-2 text-sm leading-relaxed text-ocean">
                {section.body}
                {section.title === 'Risk classification' && summarySentence
                  ? ` ${summarySentence}`
                  : null}
              </p>
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
