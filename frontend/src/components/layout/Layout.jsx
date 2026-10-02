import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const pageMeta = {
  '/': {
    title: 'Overview',
    subtitle: 'Flood risk intelligence for Manila barangays',
  },
  '/map': {
    title: 'Priority Map',
    subtitle: 'Spatial flood risk layers',
  },
  '/alerts': {
    title: 'Alerts',
    subtitle: 'Active warnings and advisories',
  },
  '/models': {
    title: 'Models',
    subtitle: 'Model performance and comparisons',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Workspace preferences',
  },
}

export default function Layout() {
  const { pathname } = useLocation()
  const meta = pageMeta[pathname] ?? pageMeta['/']

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfeff_0%,_#f8fafc_45%,_#f1f5f9_100%)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
