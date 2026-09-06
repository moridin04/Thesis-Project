import { Outlet, useLocation } from 'react-router-dom'
import UserSidebar from './user/UserSidebar'
import UserTopbar from './user/UserTopbar'

const pageMeta = {
  '/app/dashboard': {
    title: 'Dashboard',
    subtitle: 'City-wide flood risk overview',
  },
  '/app/risk-map': {
    title: 'Risk Map',
    subtitle: 'Spatial flood risk visualization',
  },
  '/app/rankings': {
    title: 'Rankings',
    subtitle: 'Barangays ordered by priority index',
  },
  '/app/methodology': {
    title: 'Methodology',
    subtitle: 'How FloodRisk Manila works',
  },
  '/app/recommendations': {
    title: 'Recommendations',
    subtitle: 'Guidance for high-risk communities',
  },
}

export default function UserLayout() {
  const { pathname } = useLocation()
  const barangayMatch = pathname.match(/^\/app\/barangays\/([^/]+)/)
  const barangayId = barangayMatch?.[1]

  const meta = barangayId
    ? {
        title: 'Barangay Detail',
        subtitle: `Profile · ${decodeURIComponent(barangayId)}`,
      }
    : (pageMeta[pathname] ?? pageMeta['/app/dashboard'])

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfeff_0%,_#f8fafc_42%,_#f1f5f9_100%)]">
      <UserSidebar />
      <div className="pl-64">
        <UserTopbar title={meta.title} subtitle={meta.subtitle} />
        <main className="min-h-screen px-6 pb-8 pt-[5.5rem]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
