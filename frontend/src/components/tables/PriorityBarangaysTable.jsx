import RiskBadge from '../shared/RiskBadge'

function formatPopulation(n) {
  return n.toLocaleString('en-PH')
}

export default function PriorityBarangaysTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-pale/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-pale/60 text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 font-semibold text-ocean">Barangay</th>
              <th className="px-4 py-3 font-semibold text-ocean">District</th>
              <th className="px-4 py-3 font-semibold text-ocean">Risk</th>
              <th className="px-4 py-3 font-semibold text-ocean">DPI</th>
              <th className="px-4 py-3 font-semibold text-ocean">Population</th>
              <th className="px-4 py-3 font-semibold text-ocean">Flood depth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pale/50 bg-white">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-surface/80">
                <td className="px-4 py-3 font-medium text-foundation">
                  {row.barangay}
                </td>
                <td className="px-4 py-3 text-ocean">{row.district}</td>
                <td className="px-4 py-3">
                  <RiskBadge category={row.riskLevel} />
                </td>
                <td className="px-4 py-3 tabular-nums text-foundation">
                  {(row.dpi * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 tabular-nums text-ocean">
                  {formatPopulation(row.population)}
                </td>
                <td className="px-4 py-3 tabular-nums text-ocean">
                  {row.floodDepthM.toFixed(1)} m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
