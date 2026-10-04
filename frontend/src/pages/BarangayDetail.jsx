// Older barangay placeholder. App.jsx does not mount this file.
// The live profile is pages/public/BarangayProfile.jsx at /barangays/:id.
// This file reads the barangayId param and calls no service.
import { useParams } from 'react-router-dom'
import PagePlaceholder from '../components/PagePlaceholder'

// Placeholder text. It names the barangay when barangayId is present.
export default function BarangayDetail() {
  const { barangayId } = useParams()

  return (
    <PagePlaceholder
      title="Barangay Detail"
      description={
        barangayId
          ? `Detail profile for barangay “${barangayId}” — indicators, risk drivers, and scenario impacts.`
          : 'Select a barangay from Rankings or the Priority Map to view its detailed risk profile.'
      }
    />
  )
}
