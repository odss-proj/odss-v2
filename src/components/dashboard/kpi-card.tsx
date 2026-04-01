type Props = {
  title: string
  value: string
  color?: string
  icon?: React.ReactNode
}

export default function KpiCard({
  title,
  value,
  color,
  icon,
}: Props) {
  return (
    <div className="bg-white p-4 rounded-2xl border flex justify-between items-center">

      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
        <p className="text-xs text-gray-400">In this Quarter</p>
      </div>

      <div className={`p-3 rounded-full ${color || "bg-gray-100"}`}>
        {icon || "📊"}
      </div>

    </div>
  )
}