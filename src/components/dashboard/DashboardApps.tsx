"use client"

import { useState } from "react"
import Banner from "../layout/banner"
import KpiCard from "../layout/kpi-card"
import DTTransferView from "../kpi/DTTransferView"
import OwnCloudView from "../kpi/OwnCloudView"
import MonitoringWFView from "../kpi/MonitoringWFView"
import CodaBacklogView from "../kpi/CodaBacklogView"
import LogixView from "../kpi/LogixView"
import AppsHomeView from "../kpi/AppsHomeView"

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
      {activeTab === "home" && <AppsHomeView />}

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
