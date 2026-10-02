import { riskBadgeClasses } from '../../theme/colors'

export default function RiskBadge({ category }) {
  const label = category || 'Medium'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${riskBadgeClasses[label] ?? riskBadgeClasses.Medium}`}
    >
      <span className="sr-only">Risk level:</span>
      {label}
    </span>
  )
}
