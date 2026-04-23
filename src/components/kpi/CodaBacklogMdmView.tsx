"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

// Tim APPS yang ditampilkan (berdasarkan first name dari task_pic_2)
// Tim MDM — nama diambil dari first name kolom task_pic_2
// Tim MDM — first name dari task_pic_2 (MISEL = nama di data, bukan MISHELL)
const APPS_TEAM = ["MAULANA", "IRHANDY", "LIA", "WIRA", "MISEL", "KUNCORO"]

// Ekstrak first name dari nama lengkap (misal "Hermanto Tandiabang" → "HERMANTO")
function extractFirstName(val: string): string {
  if (!val || val === "null" || val === "undefined") return ""
  const firstName = val.split(",")[0].trim().toUpperCase().split(" ")[0]
  return firstName
}

type CodaRow = {
  id: string
  flag_report: string
  req_type: string
  year_request: number
  quartal: string
  application: string
  appx: string
  doc_date: string
  doc_type: string
  doc_no: string
  doc_name: string
  description: string
  status_dev: string
  status_project: string
  user: string
  user_request: string
  project: string
  br_pic: string
  task_pic_2: string
  pic_name: string  // first name yang sudah di-extract
  dev_pic: string
  release: string
  year_done: string
}

// Status grouping
const STATUS_DONE = ["RELEASE", "DONE"]
const STATUS_PROGRESS = ["PILOT", "OPEN TEST", "READY TO PILOT", "DONE DEV", "READY TO TESTING PILOT", "OPG TEST", "OPG DEV", "OPEN COMPILE", "OPEN TESTING PILOT", "OK + NOTE", "OPEN REVIEW", "ON PROGRESS", "INTERNAL TESTING", "OPG TESTING PILOT"]
const STATUS_OPEN = ["OPEN DEV", "OPEN"]
const STATUS_BLOCKED = ["HOLD", "CANCEL", "ROLLBACK", "NOT OK"]

const STATUS_COLORS: Record<string, string> = {
  RELEASE: "bg-green-100 text-green-700",
  DONE: "bg-green-100 text-green-700",
  PILOT: "bg-blue-100 text-blue-700",
  "OPEN TEST": "bg-cyan-100 text-cyan-700",
  "OPEN DEV": "bg-yellow-100 text-yellow-700",
  "OPG DEV": "bg-yellow-100 text-yellow-700",
  OPEN: "bg-gray-100 text-gray-600",
  HOLD: "bg-red-100 text-red-600",
  CANCEL: "bg-red-100 text-red-600",
  ROLLBACK: "bg-red-100 text-red-600",
  "NOT OK": "bg-red-100 text-red-600",
  "READY TO PILOT": "bg-indigo-100 text-indigo-700",
  "DONE DEV": "bg-teal-100 text-teal-700",
}

function getStatusGroup(status: string) {
  if (STATUS_DONE.includes(status)) return "done"
  if (STATUS_PROGRESS.includes(status)) return "progress"
  if (STATUS_OPEN.includes(status)) return "open"
  if (STATUS_BLOCKED.includes(status)) return "blocked"
  return "other"
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-600"
}

type PicStat = { pic: string; total: number; done: number; progress: number; open: number; blocked: number; rate: number }

export default function CodaBacklogMdmView() {
  const [data, setData] = useState<CodaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterYear, setFilterYear] = useState("2026")
  const [filterQuartal, setFilterQuartal] = useState("ALL")
  const [filterPIC, setFilterPIC] = useState("ALL")
  const [filterApp, setFilterApp] = useState("ALL")
  const [activeSection, setActiveSection] = useState<"overview" | "bypic" | "byapp" | "list">("overview")
  const [search, setSearch] = useState("")
  const [tablePage, setTablePage] = useState(1)
  const PAGE_SIZE = 15

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let allRows: Record<string, unknown>[] = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: rows, error: err } = await supabase
          .from("coda_main")
          .select("*")
          .range(from, from + pageSize - 1)

        if (err) { setError("Gagal mengambil data: " + err.message); setLoading(false); return }
        if (!rows || rows.length === 0) break
        allRows = [...allRows, ...rows]
        if (rows.length < pageSize) break
        from += pageSize
      }

      const normalized = allRows.map((r) => {
        const taskPic = String(r["task_pic_2"] ?? "")
        const picName = extractFirstName(taskPic)
        return {
          id: String(r["id"] ?? ""),
          flag_report: String(r["flag_report"] ?? ""),
          req_type: String(r["req_type"] ?? ""),
          year_request: Number(r["year_request"] ?? 0),
          quartal: String(r["quartal"] ?? ""),
          application: String(r["application"] ?? ""),
          appx: String(r["appx"] ?? ""),
          doc_date: String(r["doc_date"] ?? ""),
          doc_type: String(r["doc_type"] ?? ""),
          doc_no: String(r["doc_no"] ?? ""),
          doc_name: String(r["doc_name"] ?? ""),
          description: String(r["description"] ?? ""),
          status_dev: String(r["status_dev"] ?? ""),
          status_project: String(r["status_project"] ?? ""),
          user: String(r["user"] ?? ""),
          user_request: String(r["user_request"] ?? ""),
          project: String(r["project"] ?? ""),
          br_pic: String(r["br_pic"] ?? ""),
          task_pic_2: taskPic,
          pic_name: picName,
          dev_pic: String(r["dev_pic"] ?? ""),
          release: String(r["release"] ?? ""),
          year_done: String(r["year_done"] ?? ""),
        } as CodaRow
      })

      // Filter hanya tim APPS
      const appsOnly = normalized.filter((r) => APPS_TEAM.includes(r.pic_name))
      setData(appsOnly)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filters
  const filtered = data.filter((r) => {
    if (filterYear !== "ALL" && String(r.year_request) !== filterYear) return false
    if (filterQuartal !== "ALL" && r.quartal !== filterQuartal) return false
    if (filterPIC !== "ALL" && r.pic_name !== filterPIC) return false
    if (filterApp !== "ALL" && r.application !== filterApp) return false
    return true
  })

  // Stats
  const total = filtered.length
  const doneCount = filtered.filter((r) => getStatusGroup(r.status_dev) === "done").length
  const progressCount = filtered.filter((r) => getStatusGroup(r.status_dev) === "progress").length
  const openCount = filtered.filter((r) => getStatusGroup(r.status_dev) === "open").length
  const blockedCount = filtered.filter((r) => getStatusGroup(r.status_dev) === "blocked").length
  const doneRate = total > 0 ? doneCount / total : 0

  // By PIC (tim APPS)
  const picStats: PicStat[] = APPS_TEAM.reduce<PicStat[]>((acc, pic) => {
    const rows = filtered.filter((r) => r.pic_name === pic)
    if (rows.length === 0) return acc
    acc.push({
      pic,
      total: rows.length,
      done: rows.filter((r) => getStatusGroup(r.status_dev) === "done").length,
      progress: rows.filter((r) => getStatusGroup(r.status_dev) === "progress").length,
      open: rows.filter((r) => getStatusGroup(r.status_dev) === "open").length,
      blocked: rows.filter((r) => getStatusGroup(r.status_dev) === "blocked").length,
      rate: rows.filter((r) => getStatusGroup(r.status_dev) === "done").length / rows.length,
    })
    return acc
  }, []).sort((a, b) => b.total - a.total)

  // By Application
  const apps = [...new Set(filtered.map((r) => r.application).filter(Boolean))]
  const appStats = apps.map((app) => {
    const rows = filtered.filter((r) => r.application === app)
    return {
      app,
      total: rows.length,
      done: rows.filter((r) => getStatusGroup(r.status_dev) === "done").length,
      rate: rows.length > 0 ? rows.filter((r) => getStatusGroup(r.status_dev) === "done").length / rows.length : 0,
    }
  }).sort((a, b) => b.total - a.total).slice(0, 10)

  // Status breakdown
  const statusGroups = [
    { label: "Release / Done", count: doneCount, color: "bg-green-500", textColor: "text-green-600" },
    { label: "On Progress", count: progressCount, color: "bg-blue-500", textColor: "text-blue-600" },
    { label: "Open / Backlog", count: openCount, color: "bg-yellow-500", textColor: "text-yellow-600" },
    { label: "Hold / Cancel", count: blockedCount, color: "bg-red-500", textColor: "text-red-600" },
  ]

  // Unique filter values
  const years = [...new Set(data.map((r) => String(r.year_request)).filter((y) => y !== "0" && y !== "NaN"))].sort().reverse()
  const quartals = [...new Set(filtered.map((r) => r.quartal).filter(Boolean))].sort()
  const allPics = APPS_TEAM.filter((p) => data.some((r) => r.pic_name === p))
  const allApps = [...new Set(filtered.map((r) => r.application).filter(Boolean))].sort()

  // Table search
  const searched = filtered.filter((r) =>
    r.doc_name.toLowerCase().includes(search.toLowerCase()) ||
    r.doc_no.toLowerCase().includes(search.toLowerCase()) ||
    r.application.toLowerCase().includes(search.toLowerCase()) ||
    r.br_pic.toLowerCase().includes(search.toLowerCase()) ||
    r.status_dev.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE))
  const paginated = searched.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Memuat data Coda Backlog...</p>
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

        {/* Year */}
        <div className="flex gap-2">
          <button onClick={() => setFilterYear("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterYear === "ALL" ? "bg-purple-500 text-white border-purple-500" : "bg-white text-gray-500 border-gray-200"}`}>
            Semua Tahun
          </button>
          {years.map((y) => (
            <button key={y} onClick={() => setFilterYear(y)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterYear === y ? "bg-purple-500 text-white border-purple-500" : "bg-white text-gray-500 border-gray-200"}`}>
              {y}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Quartal */}
        <div className="flex gap-2">
          <button onClick={() => setFilterQuartal("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterQuartal === "ALL" ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-gray-500 border-gray-200"}`}>
            All Q
          </button>
          {quartals.map((q) => (
            <button key={q} onClick={() => setFilterQuartal(q)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterQuartal === q ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-gray-500 border-gray-200"}`}>
              {q}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* PIC */}
        <select value={filterPIC} onChange={(e) => setFilterPIC(e.target.value)}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400">
          <option value="ALL">Semua TAS</option>
          {allPics.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* App */}
        <select value={filterApp} onChange={(e) => setFilterApp(e.target.value)}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400">
          <option value="ALL">Semua Aplikasi</option>
          {allApps.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <div className="ml-auto text-xs text-gray-400">{filtered.length.toLocaleString()} items</div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Total Dokumen</p>
          <h2 className="text-3xl font-bold text-gray-800">{total.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">Semua status</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Release / Done</p>
          <h2 className="text-3xl font-bold text-green-600">{doneCount.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">{(doneRate * 100).toFixed(1)}% dari total</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">On Progress</p>
          <h2 className="text-3xl font-bold text-blue-600">{progressCount.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">Pilot, Test, Dev, dll</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Open / Backlog</p>
          <h2 className={`text-3xl font-bold ${openCount > 0 ? "text-yellow-600" : "text-green-600"}`}>{openCount.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-1">{blockedCount > 0 ? `+ ${blockedCount} Hold/Cancel` : "Semua berjalan"}</p>
        </div>
      </div>

      {/* SUB NAV */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "overview", label: "📊 Status Overview" },
          { key: "bypic", label: "👤 By TAS (Tim APPS)" },
          { key: "byapp", label: "📱 By Aplikasi" },
          { key: "list", label: "📋 Daftar Dokumen" },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as typeof activeSection)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeSection === s.key ? "bg-purple-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* STATUS OVERVIEW */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          {/* Donut-style summary */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Distribusi Status Dokumen</h3>
            <div className="grid grid-cols-4 gap-4 mb-5">
              {statusGroups.map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-3xl font-bold ${s.textColor}`}>{s.count.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                  <div className="text-xs text-gray-500">{total > 0 ? ((s.count / total) * 100).toFixed(1) : 0}%</div>
                </div>
              ))}
            </div>
            {/* Stacked progress bar */}
            <div className="w-full h-6 rounded-full overflow-hidden flex">
              {statusGroups.map((s) => (
                <div key={s.label} className={`${s.color} h-full transition-all`}
                  style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%` }}
                  title={`${s.label}: ${s.count}`} />
              ))}
            </div>
            <div className="flex gap-4 mt-3 justify-center text-xs">
              {statusGroups.map((s) => (
                <span key={s.label} className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded ${s.color} inline-block`}/>{s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Status detail breakdown */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Detail per Status Dev</h3>
            <div className="space-y-2">
              {Object.entries(
                filtered.reduce((acc, r) => {
                  const s = r.status_dev || "Unknown"
                  acc[s] = (acc[s] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-32 truncate">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(status)}`}>{status}</span>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-5 rounded-full flex items-center pl-2"
                      style={{ width: `${(count / total) * 100}%`, backgroundColor: getStatusGroup(status) === "done" ? "#22c55e" : getStatusGroup(status) === "progress" ? "#3b82f6" : getStatusGroup(status) === "open" ? "#eab308" : "#ef4444" }}>
                      <span className="text-white text-xs font-semibold">{count}</span>
                    </div>
                  </div>
                  <div className="w-12 text-xs text-gray-400 text-right">{((count / total) * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BY BR PIC */}
      {activeSection === "bypic" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Progress per TAS (Tim APPS)</h3>
          <div className="space-y-4">
            {picStats.map((p) => (
              <div key={p.pic} className="border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {p.pic.charAt(0)}
                    </div>
                    <span className="font-semibold">{p.pic}</span>
                    <span className="text-xs text-gray-400">{p.total} dokumen</span>
                  </div>
                  <span className={`text-sm font-bold ${p.rate >= 0.7 ? "text-green-600" : p.rate >= 0.4 ? "text-yellow-600" : "text-red-500"}`}>
                    {(p.rate * 100).toFixed(1)}% done
                  </span>
                </div>
                {/* Stacked bar */}
                <div className="w-full h-5 rounded-full overflow-hidden flex">
                  <div className="bg-green-400 h-full" style={{ width: `${(p.done / p.total) * 100}%` }} title={`Done: ${p.done}`} />
                  <div className="bg-blue-400 h-full" style={{ width: `${(p.progress / p.total) * 100}%` }} title={`Progress: ${p.progress}`} />
                  <div className="bg-yellow-400 h-full" style={{ width: `${(p.open / p.total) * 100}%` }} title={`Open: ${p.open}`} />
                  <div className="bg-red-400 h-full" style={{ width: `${(p.blocked / p.total) * 100}%` }} title={`Blocked: ${p.blocked}`} />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="text-green-600">✅ {p.done} done</span>
                  <span className="text-blue-500">🔵 {p.progress} progress</span>
                  <span className="text-yellow-600">⏳ {p.open} open</span>
                  {p.blocked > 0 && <span className="text-red-500">🚫 {p.blocked} blocked</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BY APLIKASI */}
      {activeSection === "byapp" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Top 10 Aplikasi</h3>
          <div className="space-y-3">
            {appStats.map((a, i) => (
              <div key={a.app} className="flex items-center gap-3">
                <div className="w-6 text-xs text-gray-400 text-right">{i + 1}</div>
                <div className="w-36 text-sm font-medium truncate">{a.app}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className="h-6 rounded-full flex items-center pl-2 bg-purple-500"
                    style={{ width: `${Math.max((a.total / appStats[0].total) * 100, 3)}%` }}>
                    <span className="text-white text-xs font-semibold">{a.total}</span>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.rate >= 0.7 ? "bg-green-100 text-green-700" : a.rate >= 0.4 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                    {(a.rate * 100).toFixed(0)}% ✅
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST DOKUMEN */}
      {activeSection === "list" && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">Daftar Dokumen</h3>
              <p className="text-xs text-gray-400 mt-0.5">{searched.length.toLocaleString()} dokumen</p>
            </div>
            <input type="text" placeholder="Cari doc name, no, aplikasi, PIC, status..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setTablePage(1) }}
              className="border rounded-xl px-3 py-2 text-sm w-72 focus:outline-none focus:border-purple-400" />
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                  <th className="px-3 py-3 text-left w-8">#</th>
                  <th className="px-3 py-3 text-left">Doc No.</th>
                  <th className="px-3 py-3 text-left">Nama Dokumen</th>
                  <th className="px-3 py-3 text-left">Aplikasi</th>
                  <th className="px-3 py-3 text-left">TAS</th>
                  <th className="px-3 py-3 text-center">Quartal</th>
                  <th className="px-3 py-3 text-center">Flag</th>
                  <th className="px-3 py-3 text-center">Status Dev</th>
                  <th className="px-3 py-3 text-center">Status Project</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.id || i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-purple-50`}>
                    <td className="px-3 py-2 text-gray-400 text-xs">{(tablePage - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs font-mono">{r.doc_no}</td>
                    <td className="px-3 py-2 font-medium text-gray-700 max-w-[220px]">
                      <p className="truncate text-xs">{r.doc_name}</p>
                      {r.description && <p className="text-gray-400 text-xs truncate">{r.description}</p>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{r.application}</td>
                    <td className="px-3 py-2 text-xs font-medium text-gray-700">{r.pic_name}</td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500">{r.quartal}</td>
                    <td className="px-3 py-2 text-center text-xs text-gray-400">{r.flag_report}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(r.status_dev)}`}>{r.status_dev}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(String(r.status_project))}`}>{r.status_project}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">Halaman {tablePage} dari {totalPages} ({searched.length.toLocaleString()} dokumen)</p>
              <div className="flex gap-1">
                <button disabled={tablePage === 1} onClick={() => setTablePage(1)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">«</button>
                <button disabled={tablePage === 1} onClick={() => setTablePage(tablePage - 1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">‹ Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let p = idx + 1
                  if (totalPages > 5 && tablePage > 3) p = tablePage - 2 + idx
                  if (p > totalPages) return null
                  return (
                    <button key={p} onClick={() => setTablePage(p)}
                      className={`px-3 py-1.5 rounded-lg border text-xs ${p === tablePage ? "bg-purple-500 text-white border-purple-500" : "hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  )
                })}
                <button disabled={tablePage === totalPages} onClick={() => setTablePage(tablePage + 1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">Next ›</button>
                <button disabled={tablePage === totalPages} onClick={() => setTablePage(totalPages)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
