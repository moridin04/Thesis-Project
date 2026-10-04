// Older methodology placeholder. App.jsx does not mount this file.
// The live page is pages/public/Methodology.jsx at /methodology.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for the research design.
export default function Methodology() {
  return (
    <PagePlaceholder
      title="Methodology"
      description="Research design, data sources, feature engineering, and modeling workflow documentation."
    />
  )
}
