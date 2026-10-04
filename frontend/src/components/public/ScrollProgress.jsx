// Thin bar that grows as the reader moves down the page.
// PublicHeader draws it along the bottom of the header.
// The amount comes from the useScrollProgress hook.

import { useScrollProgress } from '../../hooks/useScrollProgress'

/** Non-interactive progress bar under the sticky public header. */
export default function ScrollProgress() {
  const progress = useScrollProgress()

  return (
    <div
      className="scroll-progress"
      aria-hidden="true"
      style={{ '--scroll-progress': String(progress) }}
    >
      <div className="scroll-progress__bar" />
    </div>
  )
}
