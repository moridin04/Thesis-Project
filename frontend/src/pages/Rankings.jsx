// Older rankings placeholder. App.jsx does not mount this file.
// The live page is pages/public/Rankings.jsx at /rankings.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for a rankings list.
export default function Rankings() {
  return (
    <PagePlaceholder
      title="Rankings"
      description="Sorted barangay rankings by Disaster Prioritization Index, hazard, exposure, and vulnerability."
    />
  )
}
