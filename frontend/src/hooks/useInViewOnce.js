/*
 * One-time "in view" flag for scroll reveal animations.
 * No page imports this hook yet. The landing page uses scrollFade.js.
 * Reduced motion, or no IntersectionObserver, starts the element visible.
 */
import { useEffect, useRef, useState } from 'react'

// Skip the wait when motion is reduced or the observer API is missing.
function shouldStartVisible() {
  if (typeof window === 'undefined') return false
  if (typeof IntersectionObserver === 'undefined') return true
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * Reveals an element once when it enters the viewport.
 * Content stays visible if IntersectionObserver is unavailable or reduced-motion is on.
 */
export function useInViewOnce({ rootMargin = '0px 0px -8% 0px', threshold = 0.12 } = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(shouldStartVisible)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, threshold, visible])

  return { ref, visible }
}
