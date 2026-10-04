// Placeholder for a scenarios page. App.jsx does not mount this file.
// No scenarios route is registered in App.jsx.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for rainfall and intervention scenarios.
export default function Scenarios() {
  return (
    <PagePlaceholder
      title="Scenarios"
      description="What-if rainfall and intervention scenarios to explore changes in barangay flood risk."
    />
  )
}
