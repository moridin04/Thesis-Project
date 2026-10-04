/*
 * District and area labels for rankings and the priority table.
 * Rankings.jsx uses districtAreaLabel. The table uses districtAreaParts.
 * compareDistrictArea sorts District I before District X, then by area.
 */
// Roman numerals we expect in a Manila district name.
const ROMAN = { I: 1, V: 5, X: 10, L: 50 }

// Subtract when a smaller numeral comes before a larger one, as in IX.
function romanToNumber(text) {
  let total = 0
  for (let i = 0; i < text.length; i += 1) {
    const value = ROMAN[text[i]]
    const next = ROMAN[text[i + 1]] ?? 0
    total += value < next ? -value : value
  }
  return total
}

// District number, or infinity when the text is not "District N".
function districtNumber(district) {
  const match = /^District\s+([IVXL]+|\d+)$/i.exec(String(district ?? '').trim())
  if (!match) return Number.POSITIVE_INFINITY
  const token = match[1].toUpperCase()
  return /^\d+$/.test(token) ? Number(token) : romanToNumber(token)
}

/* ["District III -", "Santa Cruz"], or [district] alone when the area is missing or blank. */
export function districtAreaParts(district, area) {
  const place = area == null ? '' : String(area).trim()
  return place ? [`${district} -`, place] : [district]
}

/* "District III - Santa Cruz"; the district alone when the area is missing or blank. */
export function districtAreaLabel(district, area) {
  return districtAreaParts(district, area).join(' ')
}

/* District number first (so District X would follow District IX), then area name. */
export function compareDistrictArea(a, b) {
  const x = districtNumber(a.district)
  const y = districtNumber(b.district)
  if (x !== y) return x < y ? -1 : 1
  const byDistrict = String(a.district ?? '').localeCompare(String(b.district ?? ''), 'en', { numeric: true })
  if (byDistrict) return byDistrict
  return String(a.area ?? '').trim().localeCompare(String(b.area ?? '').trim(), 'en')
}
