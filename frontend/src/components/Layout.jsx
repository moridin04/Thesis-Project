import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const pageMeta = {
  '/': {
    title: 'Dashboard',
    subtitle: 'City-wide flood risk overview',
  },
  '/risk-map': {
    title: 'Risk Map',
    subtitle: 'Spatial flood risk visualization',
  },
  '/rankings': {
    title: 'Rankings',
    subtitle: 'Barangays ordered by priority index',
  },
  '/indicators': {
    title: 'Indicators',
    subtitle: 'Hazard, exposure, and vulnerability features',
  },
  '/scenarios': {
    title: 'Scenarios',
    subtitle: 'What-if rainfall and intervention runs',
  },
  '/model-performance': {
    title: 'Model Performance',
    subtitle: 'Metrics and model comparison',
  },
  '/methodology': {
    title: 'Methodology',
    subtitle: 'Research design and modeling workflow',
  },
  '/recommendations': {
    title: 'Recommendations',
    subtitle: 'Planning actions for high-risk areas',
  },
}

export default function Layout() {
  const { pathname } = useLocation()
  const barangayMatch = pathname.match(/^\/barangays\/([^/]+)/)
  const barangayId = barangayMatch?.[1]

  const meta = barangayId
    ? {
        title: 'Barangay Detail',
        subtitle: `Profile · ${decodeURIComponent(barangayId)}`,
      }
    : (pageMeta[pathname] ?? pageMeta['/'])

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfeff_0%,_#f8fafc_42%,_#f1f5f9_100%)]">
      <Sidebar />
      <div className="pl-64">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="min-h-screen px-6 pb-8 pt-[5.5rem]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
