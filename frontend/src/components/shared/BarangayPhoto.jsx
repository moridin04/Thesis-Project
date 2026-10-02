import { ImageOff } from 'lucide-react'

export default function BarangayPhoto({ imageUrl, alt = '', className = '' }) {
  if (imageUrl) {
    return <img src={imageUrl} alt={alt} className={className} decoding="async" />
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
