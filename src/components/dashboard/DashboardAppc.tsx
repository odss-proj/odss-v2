"use client"

import Banner from "../../components/dashboard/banner"
import KpiCard from "../../components/dashboard/kpi-card"
import PerformanceChart from "../../components/dashboard/performancechart"
import Leaderboard from "../../components/dashboard/leaderboard"

export default function DashboardAppc() {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <p className="text-sm text-gray-500">
          Good Afternoon, Napoleon!
        </p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      {/* BANNER */}
      <Banner />

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        <button className="px-4 py-2 rounded-full bg-green-500 text-white text-sm">Home</button>
        <button className="px-4 py-2 rounded-full bg-gray-100 text-sm">Data Transfer</button>
        <button className="px-4 py-2 rounded-full bg-gray-100 text-sm">Perform. Analytics</button>
        <button className="px-4 py-2 rounded-full bg-gray-100 text-sm">Owncloud</button>
        <button className="px-4 py-2 rounded-full bg-gray-100 text-sm">Area Cover</button>
        <button className="px-4 py-2 rounded-full bg-gray-100 text-sm">Backlog</button>
      </div>

      {/* ✅ KPI FULL WIDTH */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total KPI" value="16" />
        <KpiCard title="Total Bobot" value="100" />
        <KpiCard title="Total Done" value="60" />
      </div>

      {/* ✅ MAIN GRID (POINT + CHART + TASK) */}
      <div className="grid grid-cols-3 gap-4">

        {/* LEFT */}
        <div className="space-y-4">

          {/* TOTAL POINT */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl">
            <p>Total Poin</p>
            <h2 className="text-3xl font-bold">5.000</h2>
            <p className="text-sm opacity-80">
              Raih Lebih Banyak poin!
            </p>
          </div>

          {/* LEADERBOARD */}
          <Leaderboard />

        </div>

        {/* CHART */}
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold mb-2">Performance</h3>
          <PerformanceChart />
        </div>

        {/* TASK */}
        <div className="bg-white border rounded-xl p-4">

          <div className="flex justify-between mb-3">
            <h3 className="font-semibold">My Task</h3>
            <span className="text-green-500 text-sm">See All</span>
          </div>

          <div className="space-y-3">

            <div className="border rounded-lg p-3">
              <p className="font-medium text-sm">IBP CI</p>
              <span className="text-xs bg-purple-100 px-2 py-1 rounded-full">
                Review BR
              </span>
            </div>

            <div className="border rounded-lg p-3">
              <p className="font-medium text-sm">
                Permintaan Master Barang
              </p>
              <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                Open
              </span>
            </div>

            <div className="border rounded-lg p-3">
              <p className="font-medium text-sm">PI - Matrix MDM</p>
              <span className="text-xs bg-red-100 px-2 py-1 rounded-full">
                Revisi
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}