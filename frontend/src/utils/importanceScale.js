/*
 * Axis ticks for the feature-importance chart.
 * FeatureImportanceChart.jsx calls importanceTicks with the largest value.
 * The step is rounded so the axis matches the earlier chart scale.
 */
// Small gap so a value that already sits on a tick is not rounded up.
const EPSILON = 1e-9

// Trim floating-point noise before the chart prints the label.
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
