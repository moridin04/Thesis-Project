export function barangayHeading(name, area) {
  const value = area?.trim() ?? ''
  const separator = value.indexOf(' - ')
  const district = (separator === -1 ? value : value.slice(separator + 3)).trim()
  return district ? `${name}, ${district}, Manila` : `${name}, Manila`
}
