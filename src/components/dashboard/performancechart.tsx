"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const data = [
  { name: "Bobot", value: 700 },
  { name: "Done", value: 450 },
  { name: "Average", value: 480 },
]

export default function PerformanceChart() {
  return (
    <div className="w-full h-[300px]">

      <ResponsiveContainer>
        <BarChart data={data}>

          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />

          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  i === 0
                    ? "#facc15"
                    : i === 1
                    ? "#22c55e"
                    : "#3b82f6"
                }
              />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>

    </div>
  )
}