// Staff copy of the public overview, with the area column turned on.
// App.jsx mounts this at /dashboard/overview for staff and admin.
// It renders PublicDashboard, which loads usePublicBarangays.
import PublicDashboard from '../public/PublicDashboard'

// Passes showArea so the priority table includes the area column.
export default function DashboardOverview() {
  return <PublicDashboard showArea />
}
