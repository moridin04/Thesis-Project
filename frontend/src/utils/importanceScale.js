const EPSILON = 1e-9

function clean(value) {
  return Number(value.toFixed(10))
}

/* Five ticks from 0, with the step rounded up to a multiple of 0.05 at the value's magnitude
   (same scale the previous Recharts axis produced: 0.6018 -> 0-0.80, 0.4285 -> 0-0.60). */
export function importanceTicks(maxValue, count = 5) {
  const intervals = count - 1
  if (!(maxValue > 0)) return Array.from({ length: count }, (_, index) => clean(index / intervals))
  const rough = maxValue / intervals
  const scale = 10 ** (Math.floor(Math.log10(rough)) + 1)
  const ratio = Math.ceil(rough / scale / 0.05 - EPSILON) * 0.05
  const step = ratio * scale
  return Array.from({ length: count }, (_, index) => clean(step * index))
}
