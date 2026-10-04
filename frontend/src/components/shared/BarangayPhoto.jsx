// Barangay photo. Renders nothing when the image is missing.
// Priority map and barangay profile both use it.
// The page passes imageUrl. Lookup lives in data/barangayPhotos.

import { useState } from 'react'

/* Two lines of text-xs leading-snug, so a caption-less placeholder takes the same height as a captioned photo. */
const CAPTION_CLASS = 'mt-1.5 text-xs leading-snug text-ocean'
const CAPTION_SLOT_CLASS = `${CAPTION_CLASS} min-h-[2.0625rem]`

// Shows the photo. Renders nothing when it is missing.
export default function BarangayPhoto({
  imageUrl,
  alt = '',
  className = '',
  caption = null,
  reserveCaptionSpace = false,
  ...imgProps
}) {
  // Remember the URL that failed so a new URL can try again.
  const [failedUrl, setFailedUrl] = useState(null)

  if (!imageUrl || failedUrl === imageUrl) return null

  const img = (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      decoding="async"
      {...imgProps}
      onError={() => setFailedUrl(imageUrl)}
    />
  )
  if (!caption && !reserveCaptionSpace) return img
  return (
    <figure className="m-0">
      {img}
      <figcaption className={reserveCaptionSpace ? CAPTION_SLOT_CLASS : CAPTION_CLASS}>{caption}</figcaption>
    </figure>
  )
}
