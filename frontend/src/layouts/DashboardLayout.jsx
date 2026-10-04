// Staff and admin workspace: header, dashboard menu, and page body.
// App.jsx mounts this on /dashboard for the staff and admin roles.
// Child routes render through Outlet. This layout does not fetch data.
import { Outlet } from 'react-router-dom'
import PublicHeader from '../components/public/PublicHeader'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'

// Header and sidebar around the active dashboard page.
export default function DashboardLayout() {
  return (
    <div className="page-shell-public min-h-screen">
      <PublicHeader />
      <DashboardSidebar />
      <div className="workspace-main pl-64">
        <main className="min-h-[calc(100vh-var(--public-header-height))] px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
