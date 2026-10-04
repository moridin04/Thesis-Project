// Small pill: does the model class match the DPI class?
// Staff barangay list and barangay detail both show it.
// The parent passes agrees. This file does not fetch data.

// Emerald when the classes match, amber when they differ.
export default function MlAgreementBadge({ agrees }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        agrees ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {agrees ? 'Agrees with DPI class' : 'Differs from DPI class'}
    </span>
  )
}
