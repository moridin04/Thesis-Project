const users = [
  {
    user: 'City disaster-risk and planning personnel',
    need: 'Consolidated barangay information for screening and planning discussions',
  },
  {
    user: 'Barangay officials',
    need: 'Understandable local profiles and evidence for technical consultation',
  },
  {
    user: 'GIS and research personnel',
    need: 'Reproducible processing, documented sources, and quality checks',
  },
  {
    user: 'Communities',
    need: 'Indirect benefit from better-informed and more targeted preparedness planning',
  },
]

const team = [
  { name: 'Castillo, Angelo Gabriel D.', role: 'Project Manager' },
  { name: 'Bernabe, Jan Allen R.', role: 'System Analyst' },
  { name: 'Flores, Justin Neo R.', role: 'Programmer' },
  { name: 'Pagdanganan, Xavier Palasigue', role: 'Quality Assurance / Tester' },
  { name: 'Galindo, Erica O.', role: 'Documenter / Technical Writer' },
]

function InfoTable({ caption, columns, rows }) {
  return (
    <div className="card-surface overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold text-foundation">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-pale/60">
              {row.map((cell) => (
                <td key={cell} className="px-4 py-3 text-ocean">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ocean">About</p>
        <h1 className="font-display text-3xl font-bold text-foundation sm:text-4xl">
          AGOS — Analytics and Geospatial Overview for Safety
        </h1>
        <p className="text-sm font-medium text-foundation">
          A Barangay-Level Flood Risk Prioritization and Decision Support Platform
        </p>
        <p className="text-sm italic text-ocean">Daloy ng datos tungo sa mas handang pamayanan.</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-foundation">Innovation summary</h2>
        <p className="text-sm leading-relaxed text-ocean">
          AGOS is a web-based decision-support platform that transforms scattered flood-related data
          into clear, practical, and actionable barangay-level information. It combines flood-hazard
          maps with population, land area, elevation, and selected vulnerability indicators to
          generate interactive maps, detailed barangay profiles, comparative rankings, and planning
          reports covering all 897 barangays of Manila.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foundation">Target users</h2>
        <InfoTable
          caption="Target users and the need AGOS addresses"
          columns={['User', 'Need addressed']}
          rows={users.map((row) => [row.user, row.need])}
        />
      </section>

      <p className="text-sm font-medium text-foundation">National University – Manila</p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foundation">Project team</h2>
        <InfoTable
          caption="AGOS project team and roles"
          columns={['Name', 'Role']}
          rows={team.map((row) => [row.name, row.role])}
        />
        <p className="text-sm leading-relaxed text-ocean">
          Thesis Adviser: Prof. Armida P. Salazar, Faculty, College of Computing and Information
          Technologies (CCIT)
        </p>
      </section>

      <p className="disclaimer-soft px-4 py-3 text-sm leading-relaxed">
        AGOS does not replace official warning systems or professional judgment. It provides
        decision-makers with a clearer and more organized basis for action.
      </p>
    </div>
  )
}
