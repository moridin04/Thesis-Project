/**
 * Count-up animation for `.stat-number` elements when scrolled into view.
 */
export function initCountUp() {
  if (typeof document === 'undefined') return

  const statNumbers = document.querySelectorAll('.stat-number')

  if (statNumbers.length === 0) return

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  if (prefersReducedMotion) {
    return
  }

  function animateCount(el) {
    const rawText = el.textContent.trim()
    const suffix = rawText.replace(/[0-9]/g, '')
    const targetValue = parseInt(rawText.replace(/[^0-9]/g, ''), 10)

    if (Number.isNaN(targetValue)) return

    let current = 0
    const duration = 1200
    const stepTime = 20
    const steps = duration / stepTime
    const increment = targetValue / steps

    const counter = window.setInterval(() => {
      current += increment
      if (current >= targetValue) {
        el.textContent = `${targetValue}${suffix}`
        window.clearInterval(counter)
      } else {
        el.textContent = `${Math.floor(current)}${suffix}`
      }
    }, stepTime)
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target)
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.5 },
  )

  statNumbers.forEach((el) => observer.observe(el))
}
