/*
 * Adds is-visible to landing sections as they enter the viewport.
 * Landing.jsx calls this for elements with the fade-in-section class.
 * Reduced motion shows those sections right away.
 */
/**
 * Fade-in-on-scroll for elements with `.fade-in-section`.
 * Vanilla IntersectionObserver — no external animation libraries.
 */
export function initScrollFade() {
  if (typeof document === 'undefined') return

  // Lets CSS hide sections only when this script will reveal them.
  document.documentElement.classList.add('js')

  const fadeElements = document.querySelectorAll('.fade-in-section')

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (prefersReducedMotion || fadeElements.length === 0) {
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    },
  )

  fadeElements.forEach((el) => observer.observe(el))
}
