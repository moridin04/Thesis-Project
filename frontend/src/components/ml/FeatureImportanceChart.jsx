import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { colors } from '../../theme/colors'

const GROUP_COLORS = {
  Hazard: colors.secondary,
  Exposure: colors.primary,
  Vulnerability: colors.accent,
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="card-surface rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foundation">{item.label}</p>
      <p className="text-ocean">
        {item.group} · {item.importance.toFixed(4)}
        {item.std != null ? ` ± ${item.std.toFixed(4)}` : ''}
      </p>
    </div>
  )
}

export default function FeatureImportanceChart({ items }) {
  if (!items?.length) {
    return <p className="text-sm text-ocean">No importance values were published.</p>
  }
  return (
    <div>
      <div style={{ height: Math.max(220, items.length * 34) }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.pale} />
            <XAxis
              type="number"
              tick={{ fill: colors.ocean, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={190}
              tick={{ fill: colors.foundation, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: colors.secondarySoft }} content={<ChartTooltip />} />
            <Bar dataKey="importance" radius={[0, 8, 8, 0]} barSize={16}>
              {items.map((item) => (
                <Cell key={item.feature} fill={GROUP_COLORS[item.group] ?? colors.action} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-4 text-xs text-ocean">
        {Object.entries(GROUP_COLORS).map(([group, color]) => (
          <li key={group} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {group}
          </li>
        ))}
      </ul>
    </div>
  )
}
