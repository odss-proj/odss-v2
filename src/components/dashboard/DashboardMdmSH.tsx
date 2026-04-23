"use client"

import { useState } from "react"
import Banner from "../layout/banner"
import MonitoringSettingView from "../kpi/MonitoringSettingView"
import CodaBacklogMdmView from "../kpi/CodaBacklogMdmView"
import LogixMdmView from "../kpi/LogixMdmView"

type Tab = { key: string; label: string }

const TABS: Tab[] = [
  { key: "monitoring_setting", label: "Monitoring Setting" },
  { key: "coda_backlog",       label: "Coda Backlog" },
  { key: "logix",              label: "Logix" },
]

export default function DashboardMdmSH() {
  const [activeTab, setActiveTab] = useState("monitoring_setting")

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
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "monitoring_setting" && <MonitoringSettingView />}
      {activeTab === "coda_backlog"       && <CodaBacklogMdmView />}
      {activeTab === "logix"              && <LogixMdmView />}
    </div>
  )
}
