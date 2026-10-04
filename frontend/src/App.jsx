// Route table for the whole site. Layouts wrap groups of pages.
// Public pages are open. Dashboard routes need a staff or admin login.
// Admin routes need an admin login. /risk-map and /staff send people
// to the live pages. An unknown path goes back to the landing page.
// Role lists come from config/adminNav.js and config/dashboardNav.js.

import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import RoleRoute from './auth/RoleRoute'
import PublicLayout from './layouts/PublicLayout'
import PublicInsightsLayout from './layouts/PublicInsightsLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import Landing from './pages/public/Landing'
import PublicDashboard from './pages/public/PublicDashboard'
import PriorityMap from './pages/public/PriorityMap'
import Rankings from './pages/public/Rankings'
import BarangayProfile from './pages/public/BarangayProfile'
import CompareBarangays from './pages/public/CompareBarangays'
import About from './pages/public/About'
import Indicators from './pages/public/Indicators'
import Methodology from './pages/public/Methodology'
import Recommendations from './pages/public/Recommendations'
import Login from './pages/auth/Login'
import Unauthorized from './pages/auth/Unauthorized'
import DashboardOverview from './pages/dashboard/DashboardOverview'
import DashboardCompare from './pages/dashboard/DashboardCompare'
import DashboardIndicators from './pages/dashboard/DashboardIndicators'
import DashboardRecommendations from './pages/dashboard/DashboardRecommendations'
import DashboardUpload from './pages/dashboard/DashboardUpload'
import DashboardModelResults from './pages/dashboard/DashboardModelResults'
import DashboardBarangays from './pages/dashboard/DashboardBarangays'
import DashboardBarangayDetail from './pages/dashboard/DashboardBarangayDetail'
import DashboardReports from './pages/dashboard/DashboardReports'
import ReviewUploads from './pages/admin/ReviewUploads'
import ManageUsers from './pages/admin/ManageUsers'
import AdminAuditLog from './pages/admin/AdminAuditLog'
import PublicExports from './pages/admin/PublicExports'
import { ADMIN_ROUTE_ROLES } from './config/adminNav'
import { REPORT_ROUTE_ROLES } from './config/dashboardNav'

export default function App() {
  return (
    <Routes>
      {/* Landing is the index. Unauthorized is outside the other layouts. */}
      <Route index element={<Landing />} />
      <Route path="unauthorized" element={<Unauthorized />} />

      {/* Old map URL. The priority map is the page we keep. */}
      <Route path="priority-map" element={<PriorityMap />} />
      <Route path="risk-map" element={<Navigate to="/priority-map" replace />} />

      <Route element={<PublicInsightsLayout />}>
        <Route path="overview" element={<PublicDashboard />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="barangays/:id" element={<BarangayProfile />} />
        <Route path="compare" element={<CompareBarangays />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="about" element={<About />} />
        <Route path="indicators" element={<Indicators />} />
        <Route path="methodology" element={<Methodology />} />
        <Route path="recommendations" element={<Recommendations />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
      </Route>

      {/* Signed-in staff and admin. Reports are limited again inside. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['staff', 'admin']} />}>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DashboardOverview />} />
            <Route path="compare" element={<DashboardCompare />} />
            <Route path="indicators" element={<DashboardIndicators />} />
            <Route path="recommendations" element={<DashboardRecommendations />} />
            <Route path="upload" element={<DashboardUpload />} />
            <Route path="model-results" element={<DashboardModelResults />} />
            <Route element={<RoleRoute allowedRoles={REPORT_ROUTE_ROLES} />}>
              <Route path="reports" element={<DashboardReports />} />
            </Route>
            <Route path="barangays" element={<DashboardBarangays />} />
            <Route path="barangays/:id" element={<DashboardBarangayDetail />} />
          </Route>
        </Route>

        {/* Admin only. Staff who open these URLs are turned away. */}
        <Route element={<RoleRoute allowedRoles={ADMIN_ROUTE_ROLES} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="review-uploads" replace />} />
            <Route path="review-uploads" element={<ReviewUploads />} />
            <Route path="public-exports" element={<PublicExports />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="audit-log" element={<AdminAuditLog />} />
          </Route>
        </Route>
      </Route>

      <Route path="staff/*" element={<Navigate to="/dashboard/overview" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
