import { TrendingDown, TrendingUp } from 'lucide-react'

const toneStyles = {
  foundation: 'from-brand-teal to-brand-blue-400',
  ocean: 'from-brand-blue-400 to-brand-teal',
  action: 'from-brand-teal to-brand-teal',
  risk: 'from-risk to-[color:var(--risk-very-high)]',
  pale: 'from-brand-blue-100 to-brand-teal',
  slate: 'from-brand-teal to-brand-blue-400',
  teal: 'from-brand-teal to-brand-teal',
  sky: 'from-brand-blue-400 to-brand-blue-400',
  amber: 'from-[color:var(--risk-moderate)] to-risk',
  rose: 'from-risk to-[color:var(--risk-very-high)]',
}

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'foundation',
  delta,
  deltaPositive,
}) {
  const gradient = toneStyles[tone] ?? toneStyles.foundation

  return (
    <article className="card-surface relative overflow-hidden p-5">
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.14]`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-body">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-heading">
            {value}
          </p>
        </div>
        {Icon ? (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-ui">
        {typeof delta === 'string' ? (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              deltaPositive ? 'text-[color:var(--color-primary)]' : 'text-risk'
            }`}
          >
            {deltaPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {delta}
          </span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </article>
  )
}
