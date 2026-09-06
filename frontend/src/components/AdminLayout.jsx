import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './admin/AdminSidebar'
import AdminTopbar from './admin/AdminTopbar'

const pageMeta = {
  '/admin/dashboard': {
    title: 'Admin Dashboard',
    subtitle: 'System health and operational overview',
  },
  '/admin/barangays': {
    title: 'Manage Barangays',
    subtitle: 'Create, update, and review barangay records',
  },
  '/admin/datasets': {
    title: 'Manage Datasets',
    subtitle: 'Upload and version hazard and socio-economic data',
  },
  '/admin/model-results': {
    title: 'Model Results',
    subtitle: 'Inspect predictions, scores, and runs',
  },
  '/admin/scenarios': {
    title: 'Scenario Settings',
    subtitle: 'Configure rainfall and intervention scenarios',
  },
  '/admin/reports': {
    title: 'Reports',
    subtitle: 'Export summaries for thesis and stakeholders',
  },
  '/admin/users': {
    title: 'User Management',
    subtitle: 'Accounts, roles, and access control',
  },
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const meta = pageMeta[pathname] ?? pageMeta['/admin/dashboard']

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_#f8fafc_42%,_#f1f5f9_100%)]">
      <AdminSidebar />
      <div className="pl-64">
        <AdminTopbar title={meta.title} subtitle={meta.subtitle} />
        <main className="min-h-screen px-6 pb-8 pt-[5.5rem]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
