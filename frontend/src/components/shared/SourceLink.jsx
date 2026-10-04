// Small external link with an icon, used when we cite a source.
// The landing page places it under the data-source notes.
// The address is a prop. No data module.

import { ExternalLink } from 'lucide-react'

// Opens the source in a new tab without giving that tab control.
export default function SourceLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-ocean underline-offset-2 hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </a>
  )
}
