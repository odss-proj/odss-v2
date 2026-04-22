"use client"

import { useState } from "react"
import Banner from "../layout/banner"
import DTTransferAppcView from "../kpi/DTTransferAppcView"
import OwnCloudAppcView from "../kpi/OwnCloudAppcView"
import MonitoringWFAppcView from "../kpi/MonitoringWFAppcView"
import CodaBacklogAppcView from "../kpi/CodaBacklogAppcView"
import LogixAppcView from "../kpi/LogixAppcView"
import AppcHomeView from "../kpi/AppcHomeView"

type Tab = { key: string; label: string }

const TABS: Tab[] = [
  { key: "home", label: "Home" },
  { key: "dt_ho", label: "Data Transfer HO" },
  { key: "owncloud", label: "Owncloud" },
  { key: "dt_wf", label: "Data Transfer WF" },
  { key: "coda_backlog", label: "Coda Backlog" },
  { key: "logix", label: "Logix" },
]

export default function DashboardAppcSH() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="space-y-6">
      <Banner />

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "home" && <AppcHomeView />}
      {activeTab === "dt_ho" && <DTTransferAppcView />}
      {activeTab === "owncloud" && <OwnCloudAppcView />}
      {activeTab === "dt_wf" && <MonitoringWFAppcView />}
      {activeTab === "coda_backlog" && <CodaBacklogAppcView />}
      {activeTab === "logix" && <LogixAppcView />}

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
