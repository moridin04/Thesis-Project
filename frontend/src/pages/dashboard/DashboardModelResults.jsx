import ModelResultsSection from '../../components/ml/ModelResultsSection'
import PageHeader from '../../components/shared/PageHeader'

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
