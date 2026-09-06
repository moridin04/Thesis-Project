import PageHeader from '../../components/shared/PageHeader'
import { useApprovedBarangays } from '../../hooks/useApprovedBarangays'

export default function CompareBarangays() {
  const priorityBarangays = useApprovedBarangays()
  const selected = priorityBarangays.slice(0, 3)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Compare Barangays"
        subtitle="Compare up to three published barangay risk profiles"
      />
      <div className="card-surface overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-ocean">Metric</th>
              {selected.map((row) => (
                <th key={row.id} className="px-4 py-3 text-foundation">
                  {row.barangay}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-pale/60">
              <td className="px-4 py-3 font-medium text-foundation">Risk score</td>
              {selected.map((row) => (
                <td key={row.id} className="px-4 py-3 text-ocean">
                  {(row.dpi * 100).toFixed(0)}%
                </td>
              ))}
            </tr>
            <tr className="border-t border-pale/60">
              <td className="px-4 py-3 font-medium text-foundation">Population</td>
              {selected.map((row) => (
                <td key={row.id} className="px-4 py-3 text-ocean">
                  {row.population.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr className="border-t border-pale/60">
              <td className="px-4 py-3 font-medium text-foundation">Flood depth</td>
              {selected.map((row) => (
                <td key={row.id} className="px-4 py-3 text-ocean">
                  {row.floodDepthM.toFixed(1)} m
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
