// Staff copy of the public recommendations page.
// App.jsx mounts this at /dashboard/recommendations for staff and admin.
// It renders Recommendations, which reads siteContent. No API call.
import Recommendations from '../public/Recommendations'

// Same planning notes the public site uses.
export default function DashboardRecommendations() {
  return <Recommendations />
}
