// Older user-recommendations placeholder. App.jsx does not mount this file.
// The live page is pages/public/Recommendations.jsx.
// The route is /recommendations. This file calls no service.
import PagePlaceholder from '../../components/PagePlaceholder'

// Static placeholder card for preparedness guidance.
export default function UserRecommendations() {
  return (
    <PagePlaceholder
      title="Recommendations"
      description="Suggested actions and preparedness guidance for high-priority barangays."
    />
  )
}
