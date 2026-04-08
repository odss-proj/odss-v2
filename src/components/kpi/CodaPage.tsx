"use client"

import { Search, ChevronDown } from "lucide-react"

export default function CodaPage() {
  const data = [
    {
      no: 1,
      user: "CNS",
      deadline: "15 November 2025",
      name: "D26-016-SFA_Update Perhitungan Target (Bottom-Up)",
      desc: "improvement target toko SFA",
      br: "Christian Kevin",
      task: "Christian Kevin",
      status: "PILOT",
    },
  ]

  const renderStatus = (status: string) => {
    if (status === "PILOT")
      return <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs">PILOT</span>

    if (status === "OPG Test")
      return <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs">OPG Test</span>

    if (status === "Review BR")
      return <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs">Review BR</span>
  }

  return (
    <div className="space-y-6">

      {/* 🔥 BANNER SVG */}
      <div className="rounded-2xl overflow-hidden">
        <img
        src="/banner-coda.svg"
        className="w-full h-auto rounded-2xl"
        />
      </div>

      {/* 🔥 FILTER */}
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
        <span className="text-sm">
          Quartal 1 Week 8 : 25 Januari 2025 - 25 Juni 2025
        </span>
        <ChevronDown size={18} />
      </div>

      {/* 🔥 KPI CARD FIXED */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total KPI</p>
            <h2 className="text-2xl font-bold">16</h2>
            <p className="text-xs text-gray-400">Butir</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            📊
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Bobot</p>
            <h2 className="text-2xl font-bold">100</h2>
            <p className="text-xs text-gray-400">In this Quarter</p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            ⚙️
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Done</p>
            <h2 className="text-2xl font-bold">60</h2>
            <p className="text-xs text-gray-400">In this Quarter</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            ✅
          </div>
        </div>

      </div>

      {/* 🔥 SEARCH */}
      <div className="flex gap-4">

        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 w-full bg-white">
          <Search size={16} />
          <input
            placeholder="Cari Document"
            className="outline-none w-full text-sm"
          />
        </div>

        <div className="border px-4 py-2 rounded-lg bg-white text-sm flex items-center gap-2">
          Status Project <ChevronDown size={16} />
        </div>

      </div>

      {/* 🔥 TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">

        <div className="grid grid-cols-8 text-sm font-medium text-gray-500 px-4 py-3 border-b">
          <div>No</div>
          <div>User</div>
          <div>Deadline</div>
          <div>Document</div>
          <div>Description</div>
          <div>BR PIC</div>
          <div>Task PIC</div>
          <div>Status</div>
        </div>

        {data.map((item) => (
          <div key={item.no} className="grid grid-cols-8 px-4 py-4 text-sm border-b">
            <div>{item.no}</div>
            <div>{item.user}</div>
            <div>{item.deadline}</div>
            <div>{item.name}</div>
            <div>{item.desc}</div>
            <div>{item.br}</div>
            <div>{item.task}</div>
            <div>{renderStatus(item.status)}</div>
          </div>
        ))}

      </div>

    </div>
  )
}