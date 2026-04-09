"use client"

import Banner from "../layout/banner"
import KpiCard from "../layout/kpi-card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LeaderEntry {
  rank: number
  name: string
  point: number
  isCurrentUser?: boolean
}

interface TaskItem {
  id: number
  title: string
  description: string
  status: string
  statusColor: string
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const leaderboardData: LeaderEntry[] = [
  { rank: 1, name: "Alexander The Great", point: 10000 },
  { rank: 2, name: "Gregorius Theodosian", point: 7000 },
  { rank: 3, name: "Scipio", point: 6700 },
  { rank: 4, name: "Napoleon Bonap...", point: 5000, isCurrentUser: true },
]

const myTasks: TaskItem[] = [
  {
    id: 1,
    title: "IBP CI",
    description: "IBP CI - Integrasi data MOA/SAP to SNOPIX untuk kertas kerja CI",
    status: "Open DEV",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    id: 2,
    title: "IBP CI",
    description: "IBP CI - Integrasi data MOA/SAP to SNOPIX untuk kertas kerja CI",
    status: "Open DEV",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    id: 3,
    title: "IBP CI",
    description: "IBP CI - Integrasi data MOA/SAP to SNOPIX untuk kertas kerja CI",
    status: "Open DEV",
    statusColor: "bg-green-100 text-green-700",
  },
]

const chartData = [
  { name: "Sprint Velocity", value: 700 },
  { name: "Sprint Fullfillment", value: 450 },
  { name: "Backlog", value: 470 },
]

const CHART_COLORS = ["#facc15", "#22c55e", "#3b82f6"]

const TABS: string[] = ["Home", "Backlog", "ST", "Bugs"]

// ─────────────────────────────────────────────
// DevPerformanceChart
// ─────────────────────────────────────────────
function DevPerformanceChart() {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────
// LeaderGroup1
// ─────────────────────────────────────────────
function LeaderGroup1() {
  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm">
      <h2 className="font-semibold mb-4">Leader Group 1</h2>
      <div className="space-y-3">
        {leaderboardData.map((u) => {
          if (u.isCurrentUser) {
            return (
              <div
                key={u.rank}
                className="bg-green-500 text-white rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white bg-opacity-30 flex items-center justify-center font-bold text-sm">
                    {u.rank}
                  </div>
                  <span className="text-sm font-medium">{u.name}</span>
                </div>
                <span className="text-sm font-semibold">
                  {u.point.toLocaleString("id-ID")} Point
                </span>
              </div>
            )
          }

          return (
            <div key={u.rank} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                  {u.rank}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">
                    {u.point.toLocaleString("id-ID")} Point
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TaskCard
// ─────────────────────────────────────────────
function TaskCard({ task }: { task: TaskItem }) {
  return (
    <div className="border rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-orange-400 text-lg">🚩</span>
        <p className="font-semibold text-sm text-green-600">{task.title}</p>
      </div>
      <p className="text-xs text-gray-500 leading-snug">{task.description}</p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs text-gray-400">Status:</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.statusColor}`}>
          {task.status}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// DashboardDev — main export
// ─────────────────────────────────────────────
export default function DashboardDev() {
  return (
    <div className="space-y-6">

      {/* BANNER */}
      <Banner />

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              tab === "Home"
                ? "bg-green-500 text-white border-green-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total KPI"   value="16"  color="bg-blue-100"   icon="👥" />
        <KpiCard title="Total Bobot" value="100" color="bg-orange-100" icon="⚙️" />
        <KpiCard title="Total Done"  value="60"  color="bg-green-100"  icon="✅" />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-4">

        {/* LEFT — Total Poin + Leaderboard */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl relative overflow-hidden">
            <span className="absolute top-4 right-4 opacity-70 text-xl">↗</span>
            <p className="text-sm opacity-80">Total Poin</p>
            <h2 className="text-4xl font-bold mt-1">5.000</h2>
            <p className="text-sm opacity-70 mt-1">Raih Lebih Banyak poin!</p>
          </div>
          <LeaderGroup1 />
        </div>

        {/* CENTER — Performance Chart */}
        <div className="bg-white border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Performance</h3>
            <div className="flex items-center gap-2 border rounded-lg px-3 py-1 text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
              <span>Month to Date</span>
              <span>▾</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-2 text-sm text-gray-600">
            <button className="hover:text-gray-900">◀</button>
            <span className="font-medium">Februari 2026</span>
            <button className="hover:text-gray-900">▶</button>
          </div>
          <DevPerformanceChart />
        </div>

        {/* RIGHT — My Task */}
        <div className="bg-white border rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">My Task</h3>
            <button className="text-sm bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition">
              See All
            </button>
          </div>
          <div className="space-y-3">
            {myTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
