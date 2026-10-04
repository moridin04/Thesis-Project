export const PAGE_SIZES = [25, 50, 100]
export const DEFAULT_PAGE_SIZE = 50
export const PRIORITY_CLASSES = ['High', 'Medium', 'Low']
export const DISTRICTS = ['I', 'II', 'III', 'IV', 'V', 'VI']

export function parseExportHash(hash) {
  const source = String(hash || '').replace(/^#/, '')
  let params
  try {
    params = new URLSearchParams(source)
  } catch {
    params = new URLSearchParams()
  }
  const sizeRaw = Number(params.get('size'))
  const size = PAGE_SIZES.includes(sizeRaw) ? sizeRaw : DEFAULT_PAGE_SIZE
  const pageRaw = Number(params.get('page'))
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const klass = params.get('class') || ''
  const district = params.get('district') || ''
  const q = String(params.get('q') || '').slice(0, 120)
  return {
    page,
    size,
    class: PRIORITY_CLASSES.includes(klass) ? klass : '',
    district: DISTRICTS.includes(district) ? district : '',
    q,
  }
}

export function serializeExportHash(state) {
  const params = new URLSearchParams()
  if (state.page && state.page !== 1) params.set('page', String(state.page))
  if (state.size && state.size !== DEFAULT_PAGE_SIZE) params.set('size', String(state.size))
  if (state.class) params.set('class', state.class)
  if (state.district) params.set('district', state.district)
  if (state.q) params.set('q', state.q)
  const query = params.toString()
  return query ? `#${query}` : ''
}

export function rowMatches(row, state) {
  if (state.class && row.class !== state.class) return false
  if (state.district && row.district !== state.district) return false
  const q = String(state.q || '')
    .trim()
    .toLowerCase()
  if (!q) return true
  return String(row.name || '')
    .toLowerCase()
    .includes(q)
}

export function filterIndices(rows, state) {
  const matched = []
  for (let index = 0; index < rows.length; index += 1) {
    if (rowMatches(rows[index], state)) matched.push(index)
  }
  return matched
}

export function paginate(matchCount, page, size) {
  const safeSize = PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(matchCount / safeSize) || 1)
  const current = Math.min(Math.max(1, page || 1), totalPages)
  if (matchCount === 0) {
    return { page: 1, size: safeSize, totalPages: 1, start: 0, end: 0, total: 0 }
  }
  return {
    page: current,
    size: safeSize,
    totalPages,
    start: (current - 1) * safeSize + 1,
    end: Math.min(current * safeSize, matchCount),
    total: matchCount,
  }
}

export function pageNumbers(current, totalPages) {
  const pages = new Set([1, totalPages])
  for (let value = current - 2; value <= current + 2; value += 1) {
    if (value >= 1 && value <= totalPages) pages.add(value)
  }
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const items = []
  let previous = 0
  for (const value of sorted) {
    if (previous && value - previous > 1) items.push('...')
    items.push(value)
    previous = value
  }
  return items
}

export function statusText(info) {
  if (!info.total) return 'Showing 0 of 0 barangays'
  return `Showing ${info.start} to ${info.end} of ${info.total} barangays`
}

export function visibleMatchSlice(matched, info) {
  if (info.total === 0) return []
  return matched.slice(info.start - 1, info.end)
}
