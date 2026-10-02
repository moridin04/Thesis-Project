import { useParams } from 'react-router-dom'
import PagePlaceholder from '../../components/PagePlaceholder'

export default function UserBarangayDetail() {
  const { barangayId } = useParams()

  return (
    <PagePlaceholder
      title="Barangay Detail"
      description={
        barangayId
          ? `Detail profile for barangay “${barangayId}” — indicators, risk drivers, and local context.`
          : 'Select a barangay from Rankings or the Priority Map to view its profile.'
      }
    />
  )
}
