// Older model-performance placeholder. App.jsx does not mount this file.
// The live page is pages/dashboard/DashboardModelResults.jsx.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for classification metrics.
export default function ModelPerformance() {
  return (
    <PagePlaceholder
      title="Model Performance"
      description="Classification metrics, confusion matrices, and model comparison for the thesis pipeline."
    />
  )
}
