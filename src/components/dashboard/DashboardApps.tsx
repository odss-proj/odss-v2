"use client"

import { useState } from "react"
import Banner from "../layout/banner"
import KpiCard from "../layout/kpi-card"
import DTTransferView from "../kpi/DTTransferView"
import OwnCloudView from "../kpi/OwnCloudView"
import MonitoringWFView from "../kpi/MonitoringWFView"
import CodaBacklogView from "../kpi/CodaBacklogView"
import LogixView from "../kpi/LogixView"

type Tab = { key: string; label: string }

const TABS: Tab[] = [
  { key: "home", label: "Home" },
  { key: "dt_ho", label: "Data Transfer HO" },
  { key: "owncloud", label: "Owncloud" },
  { key: "dt_wf", label: "Data Transfer WF" },
  { key: "coda_backlog", label: "Coda Backlog" },
  { key: "logix", label: "Logix" },
]

const DUMMY_TASKS = [
  { title: "IBP CI", description: "IBP CI - Integrasi data MOA/SAP to SNOPIX untuk kertas kerja CI", status: "Review BR", statusColor: "bg-purple-100 text-purple-600" },
  { title: "SFA Gamifikasi", description: "Integrasi CNN Model ResNet Untuk Kebutuhan IR", status: "Opg Dev", statusColor: "bg-blue-100 text-blue-600" },
  { title: "Pembukaan Subdist Baru", description: "Pemberangkatan TAS ke Subdist 400123 - PT Tri Makmur Jaya", status: "24 Des 2026", statusColor: "bg-red-100 text-red-600", date: "24 Des 2026" },
]

const DUMMY_LEADERBOARD = [
  { rank: 1, name: "Alexander The Great", grade: "A" },
  { rank: 2, name: "Gregorius Theodosian", grade: "A" },
  { rank: 3, name: "Scipio", grade: "B" },
  { rank: 4, name: "Scipio", grade: "A" },
]

const RANK_COLORS = ["bg-yellow-400", "bg-gray-300", "bg-orange-400"]
const RANK_EMOJI = ["🥇", "🥈", "🥉"]

const CHART_DATA = [
  { name: "Alif", value: 580 }, { name: "Anas", value: 560 }, { name: "Revin", value: 540 },
  { name: "Apep", value: 550 }, { name: "Irsyad", value: 520 }, { name: "Galih", value: 590 },
]
const maxVal = Math.max(...CHART_DATA.map((d) => d.value))

export default function DashboardApps() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="space-y-6">
      <Banner />

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: DATA TRANSFER HO */}
      {activeTab === "dt_ho" && <DTTransferView />}

      {/* TAB: OWNCLOUD */}
      {activeTab === "owncloud" && <OwnCloudView />}

      {/* TAB: DATA TRANSFER WF */}
      {activeTab === "dt_wf" && <MonitoringWFView />}

      {/* TAB: CODA BACKLOG */}
      {activeTab === "coda_backlog" && <CodaBacklogView />}
      {activeTab === "logix" && <LogixView />}

      {/* TAB: HOME */}
      {activeTab === "home" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <KpiCard title="Total KPI" value="16" icon="👥" color="bg-blue-100" subtitle="Butir" />
            <KpiCard title="Total Bobot" value="100" icon="⚙️" color="bg-orange-100" subtitle="In this Quartal" />
            <KpiCard title="Total Done" value="60" icon="✅" color="bg-green-100" subtitle="In this Quartal" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* LEFT */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-500 to-teal-500 text-white p-5 rounded-2xl relative overflow-hidden">
                <p className="text-sm opacity-80">Grade Divisi</p>
                <h2 className="text-4xl font-bold mt-1">B</h2>
                <p className="text-sm opacity-80 mt-2">Raih Lebih Banyak poin!</p>
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30">
                  <span className="text-white text-xs">↗</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-semibold mb-4">Leaderboard APPS</h3>
                <div className="space-y-3">
                  {DUMMY_LEADERBOARD.map((u, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? RANK_COLORS[i] : "bg-gray-100 text-gray-500 text-xs"}`}>
                          {i < 3 ? RANK_EMOJI[i] : u.rank}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-gray-400">Grade {u.grade}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${u.grade === "A" ? "text-green-500" : u.grade === "B" ? "text-yellow-500" : "text-red-500"}`}>
                        {u.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER */}
            <div className="bg-white border rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Performance</h3>
                <div className="flex items-center gap-1 border px-3 py-1 rounded-lg text-sm text-gray-500 cursor-pointer">Month to Date ▼</div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <button className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">‹</button>
                <span className="text-sm font-medium">Februari 2026</span>
                <button className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">›</button>
              </div>
              <div className="flex items-end gap-2 h-48 px-2">
                {CHART_DATA.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-green-400 rounded-t-md hover:bg-green-500" style={{ height: `${(d.value / maxVal) * 100}%` }} />
                    <span className="text-xs text-gray-400">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-white border rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">List Task APPS</h3>
                <button className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600">See All</button>
              </div>
              <div className="space-y-3">
                {DUMMY_TASKS.map((task, i) => (
                  <div key={i} className="border rounded-xl p-3 hover:bg-gray-50">
                    <div className="flex items-start gap-2 mb-1">
                      <span>🚩</span>
                      <p className="font-semibold text-sm text-green-600">{task.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Status:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.statusColor}`}>{task.status}</span>
                    </div>
                    {task.date && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">Tanggal:</span>
                        <span className="text-xs text-red-500 font-semibold">{task.date}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB LAINNYA - Coming Soon */}
      {!["home", "dt_ho", "owncloud", "dt_wf", "coda_backlog", "logix"].includes(activeTab) && (
        <div className="bg-white rounded-2xl border p-16 text-center">
          <div className="text-5xl mb-3 opacity-30">🚧</div>
          <p className="text-gray-400 font-medium">Sedang dalam pengembangan</p>
          <p className="text-xs text-gray-300 mt-1">Fitur ini akan segera tersedia</p>
        </div>
      )}
    </div>
  )
}
