// Staff copy of the public indicators page.
// App.jsx mounts this at /dashboard/indicators for staff and admin.
// It renders Indicators, which reads indicatorSections from siteContent.
import Indicators from '../public/Indicators'

// Same indicator tables the public site uses.
export default function DashboardIndicators() {
  return <Indicators />
}
