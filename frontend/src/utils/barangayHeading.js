/*
 * Profile title such as "Barangay 310, Santa Cruz, Manila".
 * BarangayProfile.jsx passes the barangay name and its area string.
 * Text after " - " is the place. A missing area becomes "<name>, Manila".
 */
// Place name plus Manila. A blank area drops the place and keeps Manila.
export function barangayHeading(name, area) {
  const value = area?.trim() ?? ''
  const separator = value.indexOf(' - ')
  const district = (separator === -1 ? value : value.slice(separator + 3)).trim()
  return district ? `${name}, ${district}, Manila` : `${name}, Manila`
}
