// Older map placeholder. App.jsx does not mount this file.
// The live map is pages/public/PriorityMap.jsx at /priority-map.
// This file only renders PagePlaceholder and calls no service.
import PagePlaceholder from '../components/PagePlaceholder'

// Static placeholder card for the priority map.
export default function PriorityMapPlaceholder() {
  return (
    <PagePlaceholder
      title="Priority Map"
      description="Interactive Leaflet map of Manila barangays colored by predicted flood risk and DPI."
    />
  )
}
