// Older indicators placeholder. App.jsx does not mount this file.
// The live page is pages/public/Indicators.jsx at /indicators.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for the indicator catalog.
export default function Indicators() {
  return (
    <PagePlaceholder
      title="Indicators"
      description="Catalog of hazard, exposure, and vulnerability indicators used in the FloodRisk Manila model."
    />
  )
}
