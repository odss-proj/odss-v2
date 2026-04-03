import Banner from "../layout/banner"
import KpiCard from "../layout/kpi-card"
import Leaderboard from "../layout/leaderboard"
import Chart from "../layout/chart"

type KpiItem = {
  title: string
  value: string
}

type Props = {
  config: {
    name: string
    kpi: KpiItem[]
  }
}

export default function DashboardMdm({ config }: Props) {
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
            color="#e5e7eb"
            icon={<div />}
          />
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-6">

        <div className="space-y-4">

          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-5 rounded-2xl">
            <p>Total Poin</p>
            <h2 className="text-3xl font-bold">5.000</h2>
          </div>

          <Leaderboard />

        </div>

        <div className="col-span-2 bg-white p-5 rounded-2xl border">
          <h2 className="mb-4 font-semibold">
            Performance {config.name}
          </h2>
          <Chart />
        </div>

      </div>

    </div>
  )
}