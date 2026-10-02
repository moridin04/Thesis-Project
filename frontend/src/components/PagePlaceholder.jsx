import { Construction } from 'lucide-react'

export default function PagePlaceholder({ title, description }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-pale bg-white/90 px-6 py-16 text-center shadow-sm">
      <div className="icon-badge mb-4 h-12 w-12">
        <Construction className="h-6 w-6" />
      </div>
      <h2 className="font-display text-xl font-semibold text-heading">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-body">
        {description ??
          'Placeholder page for the AGOS Manila thesis prototype. Content will be added in a later sprint.'}
      </p>
    </div>
  )
}
