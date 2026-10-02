function wave(y, amp, phase) {
  let d = `M0 ${y}`
  for (let x = 0; x < 240; x += 20) {
    const dir = (x / 20 + phase) % 2 === 0 ? -1 : 1
    d += ` Q${x + 10} ${y + dir * amp} ${x + 20} ${y}`
  }
  return d
}

function windows(x, y, cols, rows, dx = 4, dy = 6) {
  let d = ''
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const wx = x + c * dx
      const wy = y + r * dy
      d += ` M${wx} ${wy}h1.6v2.6h-1.6z`
    }
  }
  return d
}

const buildings = [
  'M0 96V80H14V96Z' + windows(4, 84, 2, 1),
  'M14 96V72H30V96Z' + windows(18, 76, 3, 2),
  'M30 96V84H41V96Z',
  'M42 96V52L51 38L60 52V96Z' + windows(46, 58, 3, 5),
  'M50.4 38V24H51.6V38Z',
  'M62 96V70H76V96Z' + windows(65, 74, 3, 2),
  'M76 96V78H88V96Z',
  'M88 96V62H104V96Z' + windows(92, 66, 3, 3),
  'M104 96V82H116V96Z',
  'M116 96V68H132V96Z' + windows(120, 72, 3, 2),
  'M132 96V76H146V96Z',
  'M146 96V86H158V96Z',
  'M160 96V74H212V96Z' + windows(164, 79, 3, 2) + windows(200, 79, 3, 2),
  'M178 96V34H196V96Z M184.5 44a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0Z' + windows(182, 52, 3, 3),
  'M178 34A9 9 0 0 1 196 34Z',
  'M186.4 25.2V9H187.6V25.2Z',
  'M214 96V80H228V96Z',
  'M228 96V70H240V96Z' + windows(231, 74, 2, 2),
]

export default function SidebarSkyline({ className = '' }) {
  return (
    <svg
      viewBox="0 0 240 118"
      className={`pointer-events-none block h-auto w-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor" fillRule="evenodd">
        {buildings.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d={wave(103, 2.5, 0)} />
        <path d={wave(111, 2.5, 1)} />
      </g>
    </svg>
  )
}
