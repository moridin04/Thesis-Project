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
