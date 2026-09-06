import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import RoleRoute from './auth/RoleRoute'
import PublicLayout from './layouts/PublicLayout'
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import Landing from './pages/public/Landing'
import PublicDashboard from './pages/public/PublicDashboard'
import RiskMap from './pages/public/RiskMap'
import Rankings from './pages/public/Rankings'
import BarangayProfile from './pages/public/BarangayProfile'
import CompareBarangays from './pages/public/CompareBarangays'
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
import ReviewUploads from './pages/admin/ReviewUploads'
import ManageUsers from './pages/admin/ManageUsers'
import AdminAuditLog from './pages/admin/AdminAuditLog'

export default function App() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route path="unauthorized" element={<Unauthorized />} />

      <Route element={<PublicLayout />}>
        <Route path="overview" element={<PublicDashboard />} />
        <Route path="risk-map" element={<RiskMap />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="barangays/:id" element={<BarangayProfile />} />
        <Route path="compare" element={<CompareBarangays />} />
        <Route path="indicators" element={<Indicators />} />
        <Route path="methodology" element={<Methodology />} />
        <Route path="recommendations" element={<Recommendations />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['staff', 'admin']} />}>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<DashboardOverview />} />
            <Route path="compare" element={<DashboardCompare />} />
            <Route path="indicators" element={<DashboardIndicators />} />
            <Route path="recommendations" element={<DashboardRecommendations />} />
            <Route path="upload" element={<DashboardUpload />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="review-uploads" replace />} />
            <Route path="review-uploads" element={<ReviewUploads />} />
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
