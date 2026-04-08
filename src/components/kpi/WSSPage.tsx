"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function WSSPage() {
  const [activeTab, setActiveTab] = useState("HO")

  const tabs = [
    { key: "HO", label: "Data Transfer HO" },
    { key: "WF", label: "Data Transfer WF" },
    { key: "OWN", label: "Owncloud" },
    { key: "AREA", label: "Area Cover" },
  ]

  return (
    <div className="space-y-6">

      {/* 🔥 BANNER */}
      <div className="rounded-2xl overflow-hidden">
        <img
        src="/banner-coda.svg"
        className="w-full h-auto rounded-2xl"
        />
      </div>


      {/* 🔥 TAB */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                activeTab === tab.key
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white border px-4 py-2 rounded-lg text-sm">
          Last Update 19:17:28 <span className="italic">18 Min Ago</span>
        </div>
      </div>

      {/* 🔥 FILTER */}
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
        <span className="text-sm font-medium text-blue-600">
          Date From and Date To
        </span>
        <ChevronDown size={18} />
      </div>

      {/* 🔥 KPI CARD */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total Ticket" value="16" />
        <Card title="Total Open" value="100" />
        <Card title="Total Done" value="60" />
        <Card title="Total Done" value="60" />
      </div>

      {/* 🔥 CONTENT SWITCH */}
      {activeTab === "HO" && <DataTransferHO />}
      {activeTab === "WF" && <DataTransferWF />}
      {activeTab === "OWN" && <Owncloud />}
      {activeTab === "AREA" && <AreaCover />}
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
        <p className="text-xs text-gray-400">Ticket</p>
      </div>
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        ✔
      </div>
    </div>
  )
}

//
// 🔥 TAB 1 — DATA TRANSFER HO
//
function DataTransferHO() {
  return (
    <div className="grid grid-cols-2 gap-6">

      <Box title="PIC Performance — CNS" />
      <Box title="PIC Performance — East" />
      <Box title="PIC Performance — West" />
      <Box title="PIC Performance — Central" />

    </div>
  )
}

//
// 🔥 TAB 2 — DATA TRANSFER WF
//
function DataTransferWF() {
  return (
    <div className="grid grid-cols-3 gap-6">

      <div className="col-span-2 bg-white p-5 rounded-xl border">
        <h3 className="font-semibold mb-4">Daily Performance Trend</h3>
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          Chart Here
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border">
        <h3 className="font-semibold mb-4">On Delay</h3>
        <p className="text-sm text-gray-500">HERMANTO - 2 Delayed</p>
        <p className="text-sm text-gray-500">ASEP - 2 Delayed</p>
      </div>

      <div className="col-span-2 bg-white p-5 rounded-xl border">
        <h3 className="font-semibold mb-4">Performance by PIC</h3>
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          Chart Here
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border">
        <h3 className="font-semibold mb-4">Complete</h3>
        <p className="text-sm text-gray-500">Taufik ✔</p>
        <p className="text-sm text-gray-500">Aswan ✔</p>
      </div>

    </div>
  )
}

//
// 🔥 TAB 3 — OWNCLOUD
//
function Owncloud() {
  return (
    <div className="grid grid-cols-2 gap-6">

      <div className="bg-white p-5 rounded-xl border">
        <h3 className="font-semibold mb-4">Weekly Completion Trend</h3>
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          Chart Here
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border">
        <h3 className="font-semibold mb-4">Upload Performance</h3>
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          Chart Here
        </div>
      </div>

    </div>
  )
}

//
// 🔥 TAB 4 — AREA COVER
//
function AreaCover() {
  return (
    <div className="bg-white p-5 rounded-xl border space-y-4">

      <h2 className="text-lg font-semibold">Area Coverage</h2>

      {/* FILTER */}
      <div className="grid grid-cols-4 gap-3">
        <input className="border p-2 rounded" placeholder="Search Kode" />
        <input className="border p-2 rounded" placeholder="Search Nama" />
        <input className="border p-2 rounded" placeholder="Search Area" />
        <select className="border p-2 rounded">
          <option>All Regions</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 bg-gray-50 px-4 py-2 text-sm font-medium">
          <div>Kode</div>
          <div>Nama</div>
          <div>Area</div>
          <div>Region</div>
          <div>PIC</div>
        </div>

        <div className="grid grid-cols-5 px-4 py-3 text-sm border-t">
          <div>113065</div>
          <div>PT. Cipta Niaga</div>
          <div>Tangerang</div>
          <div>CNS</div>
          <div>Yoshi</div>
        </div>
      </div>

    </div>
  )
}

function Box({ title }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="text-gray-400 text-sm">Table content...</div>
    </div>
  )
}