// Staff copy of the public compare page.
// App.jsx mounts this at /dashboard/compare for staff and admin.
// It renders CompareBarangays, which calls fetchPublicRankings.
import CompareBarangays from '../public/CompareBarangays'

// Same comparison table the public site uses.
export default function DashboardCompare() {
  return <CompareBarangays />
}
