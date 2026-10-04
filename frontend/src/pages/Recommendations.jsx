// Older recommendations placeholder. App.jsx does not mount this file.
// The live page is pages/public/Recommendations.jsx at /recommendations.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for planning recommendations.
export default function Recommendations() {
  return (
    <PagePlaceholder
      title="Recommendations"
      description="Priority actions and planning recommendations derived from high-risk barangay analysis."
    />
  )
}
