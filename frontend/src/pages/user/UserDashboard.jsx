// Older user-dashboard placeholder. App.jsx does not mount this file.
// The live overview is pages/public/PublicDashboard.jsx at /overview.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../../components/PagePlaceholder'

// Static placeholder card for a user overview.
export default function UserDashboard() {
  return (
    <PagePlaceholder
      title="User Dashboard"
      description="Overview of city flood risk, priority barangays, and quick links for citizens and researchers."
    />
  )
}
