import Header from "../../../components/header"
import Banner from "../../../components/banner"
import KpiCard from "../../../components/kpi-card"
import Leaderboard from "../../../components/leaderboard"
import Chart from "../../../components/chart"

import { BarChart3, CheckCircle, Activity } from "lucide-react"

export default function Page() {
  return (
    <div className="space-y-6">

      {/* BANNER (FULL IMAGE) */}
      <Banner />

      {/* TAB + FILTER */}
      <div className="flex justify-between items-center">

        <div className="flex gap-2">
          <button className="bg-green-500 text-white px-4 py-2 rounded-full shadow">
            Home
          </button>

          <button className="bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200">
            Monitoring Audit
          </button>

          <button className="bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200">
            Project
          </button>
        </div>

        <div className="bg-white border px-4 py-2 rounded-lg text-sm shadow-sm">
          Month to Date ▼
        </div>

      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">

        <KpiCard
          title="Total Setting"
          value="16"
          color="#dbeafe"
          icon={<BarChart3 size={18} />}
        />

        <KpiCard
          title="Total Release"
          value="100"
          color="#fde68a"
          icon={<CheckCircle size={18} />}
        />

        <KpiCard
          title="Service Level"
          value="80%"
          color="#bbf7d0"
          icon={<Activity size={18} />}
        />

        <KpiCard
          title="Service Akurasi"
          value="85%"
          color="#bbf7d0"
          icon={<Activity size={18} />}
        />

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="space-y-4">

          {/* TOTAL POINT */}
          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-5 rounded-2xl shadow-md">
            <p className="text-sm opacity-90">Total Poin</p>
            <h2 className="text-3xl font-bold">5.000</h2>
            <p className="text-xs opacity-80">
              Raih Lebih Banyak Poin!
            </p>
          </div>

          {/* LEADERBOARD */}
          <Leaderboard />

        </div>

        {/* RIGHT (CHART) */}
        <div className="col-span-2 bg-white p-5 rounded-2xl border shadow-sm">

          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Performance</h2>

            <div className="bg-gray-100 px-3 py-1 rounded-lg text-sm">
              Month to Date ▼
            </div>
          </div>

          <Chart />

        </div>

      </div>

    </div>
  )
}