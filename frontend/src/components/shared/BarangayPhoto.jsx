// Barangay photo, or a placeholder when the image is missing.
// Priority map and barangay profile both use it.
// The page passes imageUrl. Lookup lives in data/barangayPhotos.

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

/* Two lines of text-xs leading-snug, so a caption-less placeholder takes the same height as a captioned photo. */
const CAPTION_CLASS = 'mt-1.5 text-xs leading-snug text-ocean'
const CAPTION_SLOT_CLASS = `${CAPTION_CLASS} min-h-[2.0625rem]`

// Shows the photo, or a same-height placeholder when it is missing.
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

  if (imageUrl && failedUrl !== imageUrl) {
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

  const placeholder = (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-pale/70 text-ocean ${className}`}
      role="img"
      aria-label="Photo not yet available"
    >
      <ImageOff className="h-6 w-6" aria-hidden />
      <span className="text-xs">Photo not yet available</span>
    </div>
  )
  if (!reserveCaptionSpace) return placeholder
  return (
    <div>
      {placeholder}
      <div className={CAPTION_SLOT_CLASS} aria-hidden />
    </div>
  )
}
