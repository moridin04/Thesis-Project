// Text link with a left arrow that sends the reader back.
// Dashboard barangay detail uses it to return to the list.
// It only needs a route string. No data module.

import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/* Sits above PageHeader. 44px tall touch target below sm; text height from sm up. */
export default function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      className="link-primary mb-3 flex w-fit min-h-11 items-center gap-1.5 rounded-md text-sm hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] sm:min-h-0"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      {children}
    </Link>
  )
}
