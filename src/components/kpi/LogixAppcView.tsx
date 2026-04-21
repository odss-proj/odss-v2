"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const APPS_TEAM = ["FAJRUL", "ASWAN", "IHSAN", "BRELY", "TAUFIK", "ACHMAD", "AANG"]

const SEVERITY_COLORS: Record<string, string> = {
  "HIGH PRIORITY": "bg-red-100 text-red-700",
  "MEDIUM PRIORITY": "bg-yellow-100 text-yellow-700",
  "LOW PRIORITY": "bg-blue-100 text-blue-700",
  "NEW TICKET": "bg-gray-100 text-gray-600",
}

const STATUS_COLORS: Record<string, string> = {
  "SOLVED": "bg-green-100 text-green-700",
  "OPEN": "bg-yellow-100 text-yellow-700",
  "APPS R1": "bg-orange-100 text-orange-700",
  "APPS R2": "bg-red-100 text-red-700",
  "MDM R1": "bg-purple-100 text-purple-700",
}

type LogixRow = {
  id: string
  id_user: string
  user_name: string
  kd_branch: string
  branch: string
  pic_branch: string
  nomor_ticket: string
  ticket_created_date: string
  ticket_created_month: number
  severity: string
  type_supporting: string
  sub_type_supporting: string
  detail_issue: string
  aplikasi: string
  status_ticket: string
  last_state: string
  ticket_close_date: string
  ticket_durasi: string
  ticket_durasi_in_s: number
  tas_pic: string
  tas_respon_time_in_s: number
  durasi_ticket_hari: number
  judul_ticket: string
}

type TasStat = {
  tas: string
  total: number
  solved: number
  open: number
  high: number
  medium: number
  low: number
  avg_durasi_h: number
}

type MonthStat = { month: number; total: number; solved: number }
type SubTypeStat = { sub_type: string; count: number }

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "-"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return `${h}h ${m}m`
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

export default function LogixAppcView() {
  const [data, setData] = useState<LogixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterTas, setFilterTas] = useState("ALL")
  const [filterMonth, setFilterMonth] = useState("ALL")
  const [filterSeverity, setFilterSeverity] = useState("ALL")
  const [activeSection, setActiveSection] = useState<"overview" | "bytas" | "tickets">("overview")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let allRows: Record<string, unknown>[] = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: rows, error: err } = await supabase
          .from("logix")
          .select("*")
          .range(from, from + pageSize - 1)

        if (err) { setError("Gagal mengambil data: " + err.message); setLoading(false); return }
        if (!rows || rows.length === 0) break
        allRows = [...allRows, ...rows]
        if (rows.length < pageSize) break
        from += pageSize
      }

      const normalized = allRows.map((r) => ({
        id: String(r["id"] ?? ""),
        id_user: String(r["id_user"] ?? ""),
        user_name: String(r["user_name"] ?? r["user"] ?? ""),
        kd_branch: String(r["kd_branch"] ?? ""),
        branch: String(r["branch"] ?? ""),
        pic_branch: String(r["pic_branch"] ?? ""),
        nomor_ticket: String(r["nomor_ticket"] ?? ""),
        ticket_created_date: String(r["ticket_created_date"] ?? ""),
        ticket_created_month: Number(r["ticket_created_month"] ?? 0),
        severity: String(r["severity"] ?? ""),
        type_supporting: String(r["type_supporting"] ?? ""),
        sub_type_supporting: String(r["sub_type_supporting"] ?? ""),
        detail_issue: String(r["detail_issue"] ?? ""),
        aplikasi: String(r["aplikasi"] ?? ""),
        status_ticket: String(r["status_ticket"] ?? ""),
        last_state: String(r["last_state"] ?? ""),
        ticket_close_date: String(r["ticket_close_date"] ?? ""),
        ticket_durasi: String(r["ticket_durasi"] ?? ""),
        ticket_durasi_in_s: Number(r["ticket_durasi_in_s"] ?? 0),
        tas_pic: String(r["tas_pic"] ?? "").toUpperCase().trim(),
        tas_respon_time_in_s: Number(r["tas_respon_time_in_s"] ?? 0),
        durasi_ticket_hari: Number(r["durasi_ticket_hari"] ?? 0),
        judul_ticket: String(r["judul_ticket"] ?? ""),
      } as LogixRow))

      // Filter hanya tim APPS
      const appsOnly = normalized.filter((r) => APPS_TEAM.includes(r.tas_pic))
      setData(appsOnly)
      setLoading(false)
    }
    fetchData()
  }, [])

  // User filters
  const filtered = data.filter((r) => {
    if (filterTas !== "ALL" && r.tas_pic !== filterTas) return false
    if (filterMonth !== "ALL" && String(r.ticket_created_month) !== filterMonth) return false
    if (filterSeverity !== "ALL" && r.severity !== filterSeverity) return false
    return true
  })

  const totalTickets = filtered.length
  const solvedCount = filtered.filter((r) => r.status_ticket === "SOLVED").length
  const openCount = filtered.filter((r) => r.status_ticket !== "SOLVED").length
  const highCount = filtered.filter((r) => r.severity === "HIGH PRIORITY").length
  const avgDurasi = filtered.length > 0
    ? filtered.filter((r) => r.ticket_durasi_in_s > 0).reduce((a, r) => a + r.ticket_durasi_in_s, 0) /
      Math.max(filtered.filter((r) => r.ticket_durasi_in_s > 0).length, 1)
    : 0

  // By TAS stats
  const tasStats: TasStat[] = APPS_TEAM.map((tas) => {
    const rows = filtered.filter((r) => r.tas_pic === tas)
    if (rows.length === 0) return null
    const durRows = rows.filter((r) => r.ticket_durasi_in_s > 0)
    return {
      tas,
      total: rows.length,
      solved: rows.filter((r) => r.status_ticket === "SOLVED").length,
      open: rows.filter((r) => r.status_ticket !== "SOLVED").length,
      high: rows.filter((r) => r.severity === "HIGH PRIORITY").length,
      medium: rows.filter((r) => r.severity === "MEDIUM PRIORITY").length,
      low: rows.filter((r) => r.severity === "LOW PRIORITY").length,
      avg_durasi_h: durRows.length > 0 ? durRows.reduce((a, r) => a + r.ticket_durasi_in_s, 0) / durRows.length / 3600 : 0,
    }
  }).filter(Boolean).sort((a, b) => b!.total - a!.total) as TasStat[]

  // Monthly trend
  const months = [...new Set(data.map((r) => r.ticket_created_month).filter((m) => m > 0))].sort((a, b) => a - b)
  const monthStats: MonthStat[] = months.map((m) => {
    const rows = filtered.filter((r) => r.ticket_created_month === m)
    return { month: m, total: rows.length, solved: rows.filter((r) => r.status_ticket === "SOLVED").length }
  })

  // Sub type breakdown
  const subTypeStats: SubTypeStat[] = Object.entries(
    filtered.reduce((acc, r) => {
      const st = r.sub_type_supporting || r.type_supporting || "Lainnya"
      if (st && st !== "null") acc[st] = (acc[st] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([sub_type, count]) => ({ sub_type, count }))

  // Available months for filter
  const allMonths = [...new Set(data.map((r) => String(r.ticket_created_month)).filter((m) => m !== "0"))].sort((a, b) => Number(a) - Number(b))
  const maxMonth = Math.max(...monthStats.map((m) => m.total), 1)
  const maxTas = Math.max(...tasStats.map((t) => t.total), 1)

  // Table
  const searched = filtered.filter((r) =>
    r.nomor_ticket.toLowerCase().includes(search.toLowerCase()) ||
    r.branch.toLowerCase().includes(search.toLowerCase()) ||
    r.judul_ticket.toLowerCase().includes(search.toLowerCase()) ||
    r.tas_pic.toLowerCase().includes(search.toLowerCase()) ||
    r.severity.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE))
  const paginated = searched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Memuat data Logix...</p>
    </div>
  )
  if (error) return <div className="flex items-center justify-center h-40"><p className="text-red-500 text-sm">⚠️ {error}</p></div>
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40">
      <p className="text-gray-400 text-sm">📭 Belum ada data. Superadmin perlu upload terlebih dahulu.</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-2xl border">
        <span className="text-sm font-medium text-gray-500">Filter:</span>

        {/* TAS */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterTas("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${filterTas === "ALL" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200"}`}>
            Semua TAS
          </button>
          {APPS_TEAM.filter((t) => data.some((r) => r.tas_pic === t)).map((t) => (
            <button key={t} onClick={() => setFilterTas(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${filterTas === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Month */}
        <div className="flex gap-2">
          <button onClick={() => setFilterMonth("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${filterMonth === "ALL" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
            Semua Bulan
          </button>
          {allMonths.map((m) => (
            <button key={m} onClick={() => setFilterMonth(m)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${filterMonth === m ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
              {MONTH_NAMES[Number(m)]}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Severity */}
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-orange-400">
          <option value="ALL">Semua Severity</option>
          <option value="HIGH PRIORITY">High Priority</option>
          <option value="MEDIUM PRIORITY">Medium Priority</option>
          <option value="LOW PRIORITY">Low Priority</option>
        </select>

        <div className="ml-auto text-xs text-gray-400">{filtered.length.toLocaleString()} tiket</div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Total Tiket</p>
          <h2 className="text-3xl font-bold text-gray-800">{totalTickets.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">Semua status</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Solved</p>
          <h2 className="text-3xl font-bold text-green-600">{solvedCount.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">{totalTickets > 0 ? ((solvedCount / totalTickets) * 100).toFixed(1) : 0}% resolve rate</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">High Priority</p>
          <h2 className={`text-3xl font-bold ${highCount > 0 ? "text-red-500" : "text-green-600"}`}>{highCount.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">{openCount > 0 ? `${openCount} masih open` : "Semua resolved"}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Avg. Durasi Selesai</p>
          <h2 className="text-2xl font-bold text-orange-500">{formatDuration(avgDurasi)}</h2>
          <p className="text-xs text-gray-400 mt-1">Rata-rata penyelesaian</p>
        </div>
      </div>

      {/* SUB NAV */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "bytas", label: "👤 By TAS" },
          { key: "tickets", label: "🎫 Daftar Tiket" },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as typeof activeSection)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeSection === s.key ? "bg-orange-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Trend Bulanan */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-1">Trend Tiket per Bulan</h3>
            <p className="text-xs text-gray-400 mb-4">Jumlah tiket masuk setiap bulan</p>
            <div className="flex items-end gap-3" style={{ height: 160 }}>
              {monthStats.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <span className="text-xs font-semibold text-orange-500">{m.total}</span>
                  <div className="w-full rounded-t-md bg-orange-400 hover:bg-orange-500 transition-all"
                    style={{ height: `${(m.total / maxMonth) * 130}px` }} />
                  <span className="text-xs text-gray-400">{MONTH_NAMES[m.month]}</span>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                    {MONTH_NAMES[m.month]}: {m.total} tiket ({m.solved} solved)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub Type Breakdown */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Jenis Permintaan</h3>
            <div className="space-y-2">
              {subTypeStats.map((s) => (
                <div key={s.sub_type} className="flex items-center gap-3">
                  <div className="w-36 text-xs text-gray-600 truncate">{s.sub_type}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-5 rounded-full bg-orange-400 flex items-center pl-2"
                      style={{ width: `${(s.count / subTypeStats[0].count) * 100}%` }}>
                      <span className="text-white text-xs font-semibold">{s.count}</span>
                    </div>
                  </div>
                  <div className="w-10 text-xs text-gray-400 text-right">
                    {totalTickets > 0 ? ((s.count / totalTickets) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Distribusi Severity</h3>
            <div className="grid grid-cols-3 gap-3">
              {["HIGH PRIORITY", "MEDIUM PRIORITY", "LOW PRIORITY"].map((sev) => {
                const count = filtered.filter((r) => r.severity === sev).length
                const pctVal = totalTickets > 0 ? (count / totalTickets) * 100 : 0
                const colors = { "HIGH PRIORITY": "#ef4444", "MEDIUM PRIORITY": "#eab308", "LOW PRIORITY": "#3b82f6" }
                return (
                  <div key={sev} className="text-center p-4 rounded-xl border">
                    <div className="text-2xl font-bold" style={{ color: colors[sev as keyof typeof colors] }}>{count}</div>
                    <div className="text-xs text-gray-500 mt-1">{sev.replace(" PRIORITY", "")}</div>
                    <div className="text-xs text-gray-400">{pctVal.toFixed(1)}%</div>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pctVal}%`, backgroundColor: colors[sev as keyof typeof colors] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Status Tiket</h3>
            <div className="space-y-3">
              {Object.entries(
                filtered.reduce((acc, r) => {
                  acc[r.status_ticket] = (acc[r.status_ticket] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-28 text-center ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-5 rounded-full flex items-center pl-2"
                      style={{ width: `${(count / totalTickets) * 100}%`, backgroundColor: status === "SOLVED" ? "#22c55e" : "#f97316" }}>
                      <span className="text-white text-xs font-semibold">{count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">{((count / totalTickets) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BY TAS */}
      {activeSection === "bytas" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Performa per TAS</h3>
          <div className="space-y-4">
            {tasStats.map((t) => (
              <div key={t.tas} className="border rounded-xl p-4 hover:bg-orange-50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                      {t.tas.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{t.tas}</p>
                      <p className="text-xs text-gray-400">{t.total} tiket total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{t.solved} solved</p>
                    <p className="text-xs text-gray-400">avg {t.avg_durasi_h.toFixed(1)}h</p>
                  </div>
                </div>

                {/* Severity bar */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 w-16">Severity:</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden flex">
                    {t.high > 0 && <div className="bg-red-400 h-4 flex items-center justify-center text-white text-xs" style={{ width: `${(t.high / t.total) * 100}%` }} title={`High: ${t.high}`}>{t.high > 3 ? t.high : ""}</div>}
                    {t.medium > 0 && <div className="bg-yellow-400 h-4 flex items-center justify-center text-white text-xs" style={{ width: `${(t.medium / t.total) * 100}%` }} title={`Med: ${t.medium}`}>{t.medium > 3 ? t.medium : ""}</div>}
                    {t.low > 0 && <div className="bg-blue-400 h-4 flex items-center justify-center text-white text-xs" style={{ width: `${(t.low / t.total) * 100}%` }} title={`Low: ${t.low}`}>{t.low > 3 ? t.low : ""}</div>}
                  </div>
                </div>

                <div className="flex gap-3 text-xs">
                  {t.high > 0 && <span className="text-red-500">🔴 High: {t.high}</span>}
                  {t.medium > 0 && <span className="text-yellow-600">🟡 Medium: {t.medium}</span>}
                  {t.low > 0 && <span className="text-blue-500">🔵 Low: {t.low}</span>}
                  {t.open > 0 && <span className="text-orange-500 ml-auto">⏳ Open: {t.open}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DAFTAR TIKET */}
      {activeSection === "tickets" && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">Daftar Tiket Logix</h3>
              <p className="text-xs text-gray-400 mt-0.5">{searched.length.toLocaleString()} tiket</p>
            </div>
            <input type="text" placeholder="Cari nomor tiket, branch, judul, TAS..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="border rounded-xl px-3 py-2 text-sm w-72 focus:outline-none focus:border-orange-400" />
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs">
                  <th className="px-3 py-3 text-left w-8">#</th>
                  <th className="px-3 py-3 text-left">No. Tiket</th>
                  <th className="px-3 py-3 text-left">Branch</th>
                  <th className="px-3 py-3 text-left">Judul</th>
                  <th className="px-3 py-3 text-left">TAS</th>
                  <th className="px-3 py-3 text-center">Bulan</th>
                  <th className="px-3 py-3 text-center">Severity</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-right">Durasi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.id || i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-orange-50`}>
                    <td className="px-3 py-2 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-600">{r.nomor_ticket}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 max-w-[160px] truncate">{r.branch}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 max-w-[200px] truncate">{r.judul_ticket}</td>
                    <td className="px-3 py-2 text-xs font-medium text-gray-700">{r.tas_pic}</td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500">{MONTH_NAMES[r.ticket_created_month] || "-"}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[r.severity] || "bg-gray-100 text-gray-600"}`}>
                        {r.severity.replace(" PRIORITY", "")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status_ticket] || "bg-gray-100 text-gray-600"}`}>
                        {r.status_ticket}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-500">{formatDuration(r.ticket_durasi_in_s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">Halaman {page} dari {totalPages} ({searched.length.toLocaleString()} tiket)</p>
              <div className="flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(1)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">«</button>
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let p = idx + 1
                  if (totalPages > 5 && page > 3) p = page - 2 + idx
                  if (p > totalPages) return null
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg border text-xs ${p === page ? "bg-orange-500 text-white border-orange-500" : "hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  )
                })}
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">›</button>
                <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
