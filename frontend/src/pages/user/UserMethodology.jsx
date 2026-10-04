// Older user-methodology placeholder. App.jsx does not mount this file.
// The live page is pages/public/Methodology.jsx at /methodology.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../../components/PagePlaceholder'

// Static placeholder card for a plain-language methodology.
export default function UserMethodology() {
  return (
    <PagePlaceholder
      title="Methodology"
      description="Plain-language explanation of data sources, indicators, and the FloodRisk Manila modeling approach."
    />
  )
}
