// Pill for a High, Medium, or Low priority class.
// Rankings, compare, profiles, and staff tables all use it.
// Styles come from riskBadgeClasses in theme/colors.
// High #ef5f55, Medium #f6c25b, Low #5db36b, as light tints.

import { riskBadgeClasses } from '../../theme/colors'

// Unknown labels fall back to the Medium tint.
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
