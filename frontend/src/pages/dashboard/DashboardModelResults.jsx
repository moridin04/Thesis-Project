// Staff view of model comparison, importance, and confusion matrices.
// App.jsx mounts this at /dashboard/model-results for staff and admin.
// Charts are rendered by ModelResultsSection.
// That section loads rows with useMlResults (fetchMlResults).
import ModelResultsSection from '../../components/ml/ModelResultsSection'
import PageHeader from '../../components/shared/PageHeader'

// Page title plus the shared model-results section.
export default function DashboardModelResults() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Model Results"
        subtitle="Model comparison, feature importance and held-out confusion matrices"
      />
      <ModelResultsSection />
    </div>
  )
}
