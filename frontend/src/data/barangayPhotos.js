/*
 * Illustrative photo for a barangay profile, keyed by barangay id.
 * PriorityMap.jsx calls getBarangayPhoto. Only Barangay 310 has a photo.
 * The credit text stays with the image so the caption can name the source.
 */
/* Keyed by barangay id (the value used in /barangays/:id and by the public API). */
const BARANGAY_PHOTOS = {
  'Barangay 310': {
    src: new URL('../assets/img/recto-santa-cruz-quiapo-bus-terminal.webp', import.meta.url).href,
    width: 1024,
    height: 927,
    alt: 'Illustrative street scene near a bus terminal in Recto, Santa Cruz, Manila',
    creditText: 'Illustrative photo, Recto area, Manila. Photo: Judgefloro, public domain, via Wikimedia Commons.',
    creditLinkText: 'Wikimedia Commons',
    creditUrl:
      'https://commons.wikimedia.org/wiki/File:00085jfLandscape_Barangays_Roads_Villages_Recto_Santa_Cruz_Quiapo_Manilafvf_12.jpg',
  },
}

// The photo for that id, or null when the id is missing or unknown.
export function getBarangayPhoto(barangay) {
  if (typeof barangay !== 'string' || !Object.hasOwn(BARANGAY_PHOTOS, barangay)) return null
  return BARANGAY_PHOTOS[barangay]
}
