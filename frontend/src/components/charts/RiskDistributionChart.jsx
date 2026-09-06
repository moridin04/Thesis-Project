import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="card-surface rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foundation">{item.name}</p>
      <p className="text-ocean">{item.value.toLocaleString()} barangays</p>
    </div>
  )
}

export default function RiskDistributionChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-ocean/70">
            Total
          </p>
          <p className="text-2xl font-semibold text-foundation">
            {total.toLocaleString()}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2 text-ocean">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              {item.name}
            </span>
            <span className="font-semibold text-foundation">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
