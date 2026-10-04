// Admin workspace: header, admin menu, and page body.
// App.jsx mounts this on /admin, and only the admin role can enter.
// Child routes render through Outlet. This layout does not fetch data.
import { Outlet } from 'react-router-dom'
import PublicHeader from '../components/public/PublicHeader'
import AdminSidebar from '../components/admin/AdminSidebar'

// Header and sidebar around the active admin page.
export default function AdminLayout() {
  return (
    <div className="page-shell-public min-h-screen">
      <PublicHeader />
      <AdminSidebar />
      <div className="workspace-main pl-64">
        <main className="min-h-[calc(100vh-var(--public-header-height))] px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
