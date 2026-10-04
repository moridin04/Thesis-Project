// Full-width photo carousel behind the landing hero text.
// The landing page passes the images and the hero copy.
// Slide objects come from the landing imagery module.

import { useCallback, useEffect, useRef, useState } from 'react'

const AUTO_ADVANCE_MS = 5500

/**
 * Full-bleed hero image carousel with pinned overlay content.
 * @param {{ images: { src: string, alt: string, caption: string, credit?: { photographer: string, photographerUrl: string, source: string, sourceUrl?: string } }[], children: import('react').ReactNode }} props
 */
export default function HeroCarousel({ images, children }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const rootRef = useRef(null)

  const slideCount = images.length

  // Wrap the index so the ends of the list loop.
  const goTo = useCallback(
    (index) => {
      if (slideCount === 0) return
      setActiveIndex(((index % slideCount) + slideCount) % slideCount)
    },
    [slideCount],
  )

  // Step forward.
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  // Step back.
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  // Match the reader setting for reduced motion.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    // Store whether reduced motion is requested.
    function sync() {
      setReducedMotion(media.matches)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  // Advance on a timer unless motion is reduced or the reader paused it.
  useEffect(() => {
    if (reducedMotion || isPaused || slideCount <= 1) return undefined
    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [goNext, isPaused, reducedMotion, slideCount])

  // Arrow keys change slides only while focus is inside the carousel.
  useEffect(() => {
    // Left and right arrows move between slides.
    function onKeyDown(event) {
      if (!rootRef.current?.contains(document.activeElement)) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev])

  if (slideCount === 0) return null

  const activeImage = images[activeIndex]
  const activeCaption = activeImage?.caption ?? ''
  const activeCredit = activeImage?.credit

  return (
    <section
      ref={rootRef}
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Flood risk in Metro Manila"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) {
          setIsPaused(false)
        }
      }}
    >
      <div className="hero-carousel__media" aria-hidden="true">
        {images.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt=""
            className={`hero-carousel__slide ${index === activeIndex ? 'hero-carousel__slide--active' : ''}`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        ))}
        <div className="hero-carousel__gradient" />
      </div>

      <div className="hero-carousel__overlay">
        <div className="hero-carousel__content-panel">
          <div className="hero-carousel__scrim" aria-hidden="true" />
          <div className="hero-carousel__content">{children}</div>
        </div>
      </div>

      <div className="hero-carousel__caption-bar">
        <p
          key={`caption-${activeIndex}`}
          className={`hero-carousel__caption ${reducedMotion ? '' : 'hero-carousel__caption--fade'}`}
          aria-live="polite"
        >
          {activeCaption}
        </p>

        <div className="hero-carousel__caption-meta">
          {activeCredit ? (
            <p
              key={`credit-${activeIndex}`}
              className={`hero-carousel__photo-credit ${reducedMotion ? '' : 'hero-carousel__caption--fade'}`}
            >
              Photo:{' '}
              <a
                href={activeCredit.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {activeCredit.photographer}
              </a>
              {' / '}
              {activeCredit.sourceUrl ? (
                <a
                  href={activeCredit.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {activeCredit.source}
                </a>
              ) : (
                activeCredit.source
              )}
            </p>
          ) : null}

          {slideCount > 1 ? (
            <div className="hero-carousel__dots" role="tablist" aria-label="Choose slide">
              {images.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  role="tab"
                  className={`hero-carousel__dot ${index === activeIndex ? 'hero-carousel__dot--active' : ''}`}
                  aria-label={`Slide ${index + 1} of ${slideCount}`}
                  aria-selected={index === activeIndex}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Screen-reader description of the active photograph */}
      <p className="sr-only">{activeImage?.alt}</p>
    </section>
  )
}
