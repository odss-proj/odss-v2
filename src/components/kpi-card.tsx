import { ReactNode } from "react"

export default function KpiCard({
  title,
  value,
  color,
  icon,
}: {
  title: string
  value: string
  color: string
  icon: ReactNode
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm flex justify-between items-center">

      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
        <p className="text-xs text-gray-400">In this Quarter</p>
      </div>

      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

    </div>
  )
}