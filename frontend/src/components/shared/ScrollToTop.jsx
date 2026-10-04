// Sends the window back to the top after a route change.
// main.jsx mounts one copy around the whole app.
// It reads the path from React Router, not a data module.

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls the window to the top on route changes and disables the browser's
 * automatic scroll restoration so a refresh also starts at the top.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    // Skip forcing top when a hash target should be scrolled into view.
    if (window.location.hash) return

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, search])

  return null
}
