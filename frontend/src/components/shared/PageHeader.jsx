// Page title, optional subtitle, and an optional action.
// Public, dashboard, and admin pages all use this header.
// The words are props from the page. No data module.

// Heading row. The action slot is omitted when the page has none.
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="public-page-heading font-display text-2xl font-semibold tracking-tight text-heading sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-body sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
