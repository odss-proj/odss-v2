"use client"

import { Search, ChevronDown } from "lucide-react"

export default function LogixPage() {
  const data = [
    {
      no: 1,
      type: "Issue",
      support: "CNS",
      date: "15 November 2025",
      ticket: "S-210831-00003",
      pic: "Christian Kevin",
      severity: "High",
      status: "BR",
    },
    {
      no: 2,
      type: "Request",
      support: "CNS",
      date: "12 September 2025",
      ticket: "T12345668",
      pic: "Christian Kevin",
      severity: "Medium",
      status: "Open",
    },
    {
      no: 3,
      type: "Issue",
      support: "CNS",
      date: "12 Agustus 2025",
      ticket: "T12345668",
      pic: "Christian Kevin",
      severity: "Low",
      status: "Solved",
    },
  ]

  const badgeType = (type: string) => {
    if (type === "Issue")
      return <span className="bg-red-100 text-red-500 px-3 py-1 rounded-full text-xs">Issue</span>

    if (type === "Request")
      return <span className="bg-orange-100 text-orange-500 px-3 py-1 rounded-full text-xs">Request</span>
  }

  const badgeSeverity = (sev: string) => {
    if (sev === "High")
      return <span className="bg-red-100 text-red-500 px-3 py-1 rounded-full text-xs">High</span>

    if (sev === "Medium")
      return <span className="bg-orange-100 text-orange-500 px-3 py-1 rounded-full text-xs">Medium</span>

    if (sev === "Low")
      return <span className="bg-blue-100 text-blue-500 px-3 py-1 rounded-full text-xs">Low</span>
  }

  const badgeStatus = (status: string) => {
    if (status === "BR")
      return <span className="bg-red-100 text-red-500 px-3 py-1 rounded-full text-xs">BR</span>

    if (status === "Open")
      return <span className="bg-blue-100 text-blue-500 px-3 py-1 rounded-full text-xs">Open</span>

    if (status === "Solved")
      return <span className="bg-purple-100 text-purple-500 px-3 py-1 rounded-full text-xs">Solved</span>
  }

  return (
    <div className="space-y-6">

      {/* 🔥 BANNER */}
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

      {/* 🔥 KPI CARD */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Ticket</p>
            <h2 className="text-2xl font-bold">16</h2>
            <p className="text-xs text-gray-400">Ticket</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            🎫
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Open</p>
            <h2 className="text-2xl font-bold">100</h2>
            <p className="text-xs text-gray-400">Ticket</p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            ⚙️
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Done</p>
            <h2 className="text-2xl font-bold">60</h2>
            <p className="text-xs text-gray-400">Ticket</p>
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

        {/* HEADER */}
        <div className="grid grid-cols-8 text-sm font-medium text-gray-500 px-4 py-3 border-b bg-gray-50">
          <div>No</div>
          <div>Supporting</div>
          <div>PIC Support</div>
          <div>Tanggal Ticket</div>
          <div>No Ticket</div>
          <div>Task PIC</div>
          <div>Severity</div>
          <div>Status Ticket</div>
        </div>

        {/* ROW */}
        {data.map((item) => (
          <div
            key={item.no}
            className="grid grid-cols-8 px-4 py-4 text-sm border-b items-center hover:bg-gray-50 transition"
          >
            <div>{item.no}</div>
            <div>{badgeType(item.type)}</div>
            <div className="font-medium">{item.support}</div>
            <div>{item.date}</div>
            <div>{item.ticket}</div>
            <div className="font-medium">{item.pic}</div>
            <div>{badgeSeverity(item.severity)}</div>
            <div>{badgeStatus(item.status)}</div>
          </div>
        ))}

      </div>

    </div>
  )
}