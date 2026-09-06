/**
 * Equal 3-image mosaic row with shared color grade and hover captions.
 * @param {{ images: { id: string, src: string, alt: string, caption: string }[] }} props
 */
export default function FloodMosaic({ images }) {
  return (
    <div className="flood-mosaic" role="group" aria-label="Flood impact photo mosaic">
      {images.map((image) => (
        <figure key={image.id} className="flood-mosaic__cell">
          <img
            src={image.src}
            alt={image.alt}
            className="flood-mosaic__photo"
            loading="lazy"
            decoding="async"
          />
          <div className="flood-mosaic__grade" aria-hidden="true" />
          <figcaption className="flood-mosaic__caption">{image.caption}</figcaption>
        </figure>
      ))}
    </div>
  )
}
