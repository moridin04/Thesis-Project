/*
 * Counts for the public overview summary cards.
 * PublicDashboard.jsx uses summaryCounts for the headline and class totals.
 * The headline stays the full total while a filter is active.
 */
// Class names shared by the overview cards and the priority filter.
export const PRIORITY_LEVELS = ['High', 'Medium', 'Low']

// How many rows in this list have that risk level.
export function countLevel(rows, level) {
  return rows.filter((row) => row.riskLevel === level).length
}

/* Headline is always the full analyzed total; the filtered count is only a hint while a filter is active. */
export function summaryCounts(allRows, filteredRows, filtersActive) {
  return {
    analyzed: allRows.length,
    analyzedHint: filtersActive ? `Showing ${filteredRows.length.toLocaleString('en')} filtered` : undefined,
    High: countLevel(filteredRows, 'High'),
    Medium: countLevel(filteredRows, 'Medium'),
    Low: countLevel(filteredRows, 'Low'),
  }
}
