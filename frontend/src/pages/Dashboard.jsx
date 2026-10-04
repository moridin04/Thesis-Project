// Older dashboard placeholder. App.jsx does not mount this file.
// The live overview is pages/dashboard/DashboardOverview.jsx.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for a citywide overview.
export default function Dashboard() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="City-wide flood risk overview with KPI cards, charts, and priority barangay summaries."
    />
  )
}
