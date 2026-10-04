export const PRIORITY_LEVELS = ['High', 'Medium', 'Low']

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
