// Centered message for a page that has nothing to show yet.
// No page imports this file. PagePlaceholder is the one in use.
// Title and description are props. No data module.

import { Construction } from 'lucide-react'

// Shows the title, and the description only when one was passed.
export default function EmptyState({ title, description }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-pale bg-white/90 px-6 py-16 text-center shadow-sm">
      <div className="icon-badge mb-4 h-12 w-12">
        <Construction className="h-6 w-6" />
      </div>
      <h2 className="font-display text-xl font-semibold text-heading">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-body">
          {description}
        </p>
      ) : null}
    </div>
  )
}
