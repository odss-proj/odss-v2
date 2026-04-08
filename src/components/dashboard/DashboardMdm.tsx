import Banner from "../layout/banner"
import KpiCard from "../layout/kpi-card"
import Leaderboard from "../layout/leaderboard"
import Chart from "../layout/chart"

type KpiItem = {
  title: string
  value: string
  icon?: string
  color?: string
}

type LeaderboardEntry = {
  name: string
  score: number
}

type ChartEntry = {
  name: string
  Setting: number
  Akurasi: number
}

type Props = {
  config: {
    name: string
    kpi: KpiItem[]
    leaderboard: LeaderboardEntry[]
    chartData: ChartEntry[]
  }
}

export default function DashboardMdm({ config }: Props) {
  // Hitung top score untuk card "Total Poin"
  const topScore = config.leaderboard.length > 0
    ? config.leaderboard[0].score.toFixed(1)
    : "-"

  return (
    <div className="space-y-6">

      {/* BANNER */}
      <Banner />

      {/* TAB */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button className="bg-green-500 text-white px-4 py-2 rounded-full">
            Home
          </button>
          <button className="bg-gray-100 px-4 py-2 rounded-full">
            Monitoring
          </button>
          <button className="bg-gray-100 px-4 py-2 rounded-full">
            Project
          </button>
        </div>

        <div className="bg-white border px-4 py-2 rounded-lg text-sm">
          Month to Date ▼
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        {config.kpi.map((item, i) => (
          <KpiCard
            key={i}
            title={item.title}
            value={item.value}
            color={item.color ?? "bg-gray-100"}
            icon={item.icon ?? "📊"}
          />
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-6">

        <div className="space-y-4">

          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-5 rounded-2xl">
            <p className="text-sm opacity-80">Top Score</p>
            <h2 className="text-3xl font-bold">{topScore}</h2>
            <p className="text-xs opacity-70 mt-1">
              {config.leaderboard[0]?.name ?? "—"}
            </p>
          </div>

          <Leaderboard data={config.leaderboard} />

        </div>

        <div className="col-span-2 bg-white p-5 rounded-2xl border">
          <h2 className="mb-4 font-semibold">
            Performance {config.name}
          </h2>
          <Chart data={config.chartData} />
        </div>

      </div>

    </div>
  )
}