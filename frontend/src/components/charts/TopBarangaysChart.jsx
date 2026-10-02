import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { colors } from '../../theme/colors'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-surface rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foundation">{label}</p>
      <p className="text-ocean">DPI score (0–100): {Math.round(payload[0].value)}</p>
    </div>
  )
}

export default function TopBarangaysChart({ data }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke={colors.pale}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: colors.ocean, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="barangay"
            width={88}
            tick={{ fill: colors.foundation, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: colors.secondarySoft }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="priorityScore"
            fill={colors.action}
            radius={[0, 8, 8, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
