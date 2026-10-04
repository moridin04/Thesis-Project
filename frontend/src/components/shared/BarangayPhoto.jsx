import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function BarangayPhoto({ imageUrl, alt = '', className = '', caption = null, ...imgProps }) {
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
    if (!caption) return img
    return (
      <figure className="m-0">
        {img}
        <figcaption className="mt-1.5 text-xs leading-snug text-ocean">{caption}</figcaption>
      </figure>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-pale/70 text-ocean ${className}`}
      role="img"
      aria-label="Photo not yet available"
    >
      <ImageOff className="h-6 w-6" aria-hidden />
      <span className="text-xs">Photo not yet available</span>
    </div>
  )
}
