"use client"

import { Search, ChevronDown } from "lucide-react"

export default function SpreadsheetPage() {
  const data = [
    {
      no: 1,
      setting: "Kuncoro",
      release: "Kevin",
      tglSetting: "15 November 2025",
      tglRelease: "15 November 2025",
      ap: "BEV/SUN/25/01/2002",
    },
    {
      no: 2,
      setting: "Yoshi",
      release: "Mario",
      tglSetting: "12 September 2025",
      tglRelease: "12 September 2025",
      ap: "BEV/SUN/25/01/2021",
    },
    {
      no: 3,
      setting: "Mario",
      release: "Kevin",
      tglSetting: "12 Agustus 2025",
      tglRelease: "12 Agustus 2025",
      ap: "COF/TOR/25/03/3141",
    },
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

      {/* 🔥 FILTER DATE */}
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
        <span className="text-sm font-medium text-blue-600">
          Date From and Date To
        </span>
        <ChevronDown size={18} />
      </div>

      {/* 🔥 KPI CARD */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Setting</p>
            <h2 className="text-2xl font-bold">35</h2>
            <p className="text-xs text-gray-400">AP</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            ✅
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Release</p>
            <h2 className="text-2xl font-bold">15</h2>
            <p className="text-xs text-gray-400">AP</p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            ⚙️
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Service Level</p>
            <h2 className="text-2xl font-bold">16</h2>
            <p className="text-xs text-gray-400">
              Total Release vs Setting
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            📊
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
        <div className="grid grid-cols-6 text-sm font-medium text-gray-500 px-4 py-3 border-b bg-gray-50">
          <div>No</div>
          <div>PIC Setting</div>
          <div>PIC Release</div>
          <div>Tanggal Setting</div>
          <div>Tanggal Release</div>
          <div>No AP</div>
        </div>

        {/* ROW */}
        {data.map((item) => (
          <div
            key={item.no}
            className="grid grid-cols-6 px-4 py-4 text-sm border-b items-center hover:bg-gray-50 transition"
          >
            <div>{item.no}</div>
            <div className="font-medium">{item.setting}</div>
            <div className="font-medium">{item.release}</div>
            <div>{item.tglSetting}</div>
            <div>{item.tglRelease}</div>
            <div>{item.ap}</div>
          </div>
        ))}

      </div>

    </div>
  )
}