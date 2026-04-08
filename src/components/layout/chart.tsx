"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type ChartEntry = {
  name: string
  Setting: number
  Akurasi: number
}

type Props = {
  data?: ChartEntry[]
}

export default function Chart({ data = [] }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">
        Belum ada data chart
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} barGap={4}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Setting" fill="#22c55e" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Akurasi" fill="#3b82f6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}