"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

// PIC/TAS yang di-exclude (sama seperti DT Transfer)
const EXCLUDED_TAS = ["ALIF", "REVINDA", "ANAS", "GALIH", "ALDI", "YOSHI", "FAJAR", "HERMANTO", "IRSYAD", "ASEP"]

type OCRow = {
  kode_subdist: number
  nama_subdist: string
  divisi: string
  area: string
  region: string
  tahun: number
  periode: number
  week: number
  kpi: string
  pct_kel_h3: number
  pct_kel_h7: number
  pct_ach: number
  tas: string
}

type AreaStat = { area: string; ach: number; h3: number; h7: number; subdist: number }
type TasStat = { tas: string; ach: number; h3: number; h7: number; count: number }
type WeekStat = { week: number; ach: number; h3: number; h7: number }
type LowPerformer = { nama_subdist: string; area: string; tas: string; h3: number; h7: number; ach: number }

const AREA_COLORS: Record<string, string> = {
  EAST: "bg-blue-500", WEST: "bg-green-500", CENTRAL: "bg-orange-500",
}
const AREA_LIGHT: Record<string, string> = {
  EAST: "bg-blue-50 border-blue-200 text-blue-700",
  WEST: "bg-green-50 border-green-200 text-green-700",
  CENTRAL: "bg-orange-50 border-orange-200 text-orange-700",
}

function getAchColor(v: number) {
  if (v >= 0.98) return "text-green-600"
  if (v >= 0.90) return "text-yellow-600"
  return "text-red-500"
}
function getAchBg(v: number) {
  if (v >= 0.98) return "bg-green-100 text-green-700"
  if (v >= 0.90) return "bg-yellow-100 text-yellow-700"
  return "bg-red-100 text-red-600"
}
function pct(v: number) { return (v * 100).toFixed(2) + "%" }

export default function OwnCloudAppcView() {
  const [data, setData] = useState<OCRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterArea, setFilterArea] = useState("ALL")
  const [filterPeriode, setFilterPeriode] = useState("ALL")
  const [activeSection, setActiveSection] = useState<"overview" | "byarea" | "bytas" | "low">("overview")
  const [metricView, setMetricView] = useState<"ach" | "h3" | "h7">("ach")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let allRows: Record<string, unknown>[] = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: rows, error: err } = await supabase
          .from("own_cloud")
          .select("*")
          .order("week", { ascending: true })
          .range(from, from + pageSize - 1)

        if (err) { setError("Gagal mengambil data: " + err.message); setLoading(false); return }
        if (!rows || rows.length === 0) break
        allRows = [...allRows, ...rows]
        if (rows.length < pageSize) break
        from += pageSize
      }

      const normalized = allRows.map((r) => {
        const achRaw = Number(r["pct_ach"] ?? r["% ach"] ?? r["ach"] ?? 0)
        const h3Raw = Number(r["kel_h3"] ?? 0)
        const h7Raw = Number(r["kel_h7"] ?? 0)

        return {
          kode_subdist: Number(r["kode_subdist"] ?? 0),
          nama_subdist: String(r["nama_subdist"] ?? ""),
          divisi: String(r["divisi"] ?? ""),
          area: String(r["area"] ?? "").toUpperCase().trim(),
          region: String(r["region"] ?? ""),
          tahun: Number(r["tahun"] ?? 0),
          periode: Number(r["periode"] ?? 0),
          week: Number(r["week"] ?? 0),
          kpi: String(r["kpi"] ?? ""),
          pct_ach: achRaw > 1 ? achRaw / 100 : achRaw,
          pct_kel_h3: h3Raw > 1 ? h3Raw / 100 : h3Raw,
          pct_kel_h7: h7Raw > 1 ? h7Raw / 100 : h7Raw,
          tas: String(r["tas"] ?? "").toUpperCase().trim(),
        } as OCRow
      })

      const filtered_raw = normalized.filter(
        (r) => r.area !== "CNS" && !EXCLUDED_TAS.includes(r.tas)
      )
      setData(filtered_raw)
      setLoading(false)
    }
    fetchData()
  }, [])

  // User filter
  const filtered = data.filter((r) => {
    if (filterArea !== "ALL" && r.area !== filterArea) return false
    if (filterPeriode !== "ALL" && String(r.periode) !== filterPeriode) return false
    return true
  })

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  const overallAch = avg(filtered.map((r) => r.pct_ach))
  const overallH3 = avg(filtered.map((r) => r.pct_kel_h3))
  const overallH7 = avg(filtered.map((r) => r.pct_kel_h7))

  const latestWeek = filtered.length > 0 ? Math.max(...filtered.map((r) => r.week)) : 0
  const latestData = filtered.filter((r) => r.week === latestWeek)
  const latestAch = avg(latestData.map((r) => r.pct_ach))
  const latestH3 = avg(latestData.map((r) => r.pct_kel_h3))
  const latestH7 = avg(latestData.map((r) => r.pct_kel_h7))
  const totalSubdist = new Set(filtered.map((r) => r.kode_subdist)).size
  const lowCount = latestData.filter((r) => r.pct_kel_h3 < 0.90).length

  // By area
  const areaStats: AreaStat[] = ["EAST", "WEST", "CENTRAL"].map((area) => {
    const rows = filtered.filter((r) => r.area === area)
    return {
      area,
      ach: avg(rows.map((r) => r.pct_ach)),
      h3: avg(rows.map((r) => r.pct_kel_h3)),
      h7: avg(rows.map((r) => r.pct_kel_h7)),
      subdist: new Set(rows.map((r) => r.kode_subdist)).size,
    }
  }).filter((a) => a.subdist > 0)

  // By TAS
  const tasStats: TasStat[] = [...new Set(filtered.map((r) => r.tas))].filter(Boolean).map((tas) => {
    const rows = filtered.filter((r) => r.tas === tas)
    return {
      tas,
      ach: avg(rows.map((r) => r.pct_ach)),
      h3: avg(rows.map((r) => r.pct_kel_h3)),
      h7: avg(rows.map((r) => r.pct_kel_h7)),
      count: new Set(rows.map((r) => r.kode_subdist)).size,
    }
  }).sort((a, b) => b.h3 - a.h3)

  // Weekly trend
  const weeks = [...new Set(filtered.map((r) => r.week))].sort((a, b) => a - b)
  const weekStats: WeekStat[] = weeks.map((w) => {
    const rows = filtered.filter((r) => r.week === w)
    return {
      week: w,
      ach: avg(rows.map((r) => r.pct_ach)),
      h3: avg(rows.map((r) => r.pct_kel_h3)),
      h7: avg(rows.map((r) => r.pct_kel_h7)),
    }
  })

  // Low performers
  const lowPerformers: LowPerformer[] = latestData
    .filter((r) => r.pct_kel_h3 < 0.90)
    .sort((a, b) => a.pct_kel_h3 - b.pct_kel_h3)
    .slice(0, 20)
    .map((r) => ({ nama_subdist: r.nama_subdist, area: r.area, tas: r.tas, h3: r.pct_kel_h3, h7: r.pct_kel_h7, ach: r.pct_ach }))

  const periodes = [...new Set(data.map((r) => String(r.periode)))].sort()
  const maxWeekVal = Math.max(...weekStats.map((w) => metricView === "ach" ? w.ach : metricView === "h3" ? w.h3 : w.h7), 0.01)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Memuat data Own Cloud...</p>
    </div>
  )
  if (error) return <div className="flex items-center justify-center h-40"><p className="text-red-500 text-sm">⚠️ {error}</p></div>
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-40 gap-2">
      <p className="text-gray-400 text-sm">📭 Belum ada data. Superadmin perlu upload terlebih dahulu.</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-2xl border">
        <span className="text-sm font-medium text-gray-500">Filter:</span>
        <div className="flex gap-2">
          {["ALL", "EAST", "WEST", "CENTRAL"].map((a) => (
            <button key={a} onClick={() => setFilterArea(a)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterArea === a ? "bg-teal-500 text-white border-teal-500" : "bg-white text-gray-500 border-gray-200 hover:border-teal-300"}`}>
              {a}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex gap-2">
          <button onClick={() => setFilterPeriode("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterPeriode === "ALL" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
            Semua Periode
          </button>
          {periodes.map((p) => (
            <button key={p} onClick={() => setFilterPeriode(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterPeriode === p ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
              P{p}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-400">{filtered.length.toLocaleString()} records</div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">KEL H+3 (Terkini)</p>
          <h2 className={`text-3xl font-bold ${getAchColor(latestH3)}`}>{pct(latestH3)}</h2>
          <p className="text-xs text-gray-400 mt-1">Week {latestWeek}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">KEL H+7 (Terkini)</p>
          <h2 className={`text-3xl font-bold ${getAchColor(latestH7)}`}>{pct(latestH7)}</h2>
          <p className="text-xs text-gray-400 mt-1">Week {latestWeek}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Total Subdist</p>
          <h2 className="text-3xl font-bold text-gray-800">{totalSubdist}</h2>
          <p className="text-xs text-gray-400 mt-1">Aktif</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Low Performer</p>
          <h2 className={`text-3xl font-bold ${lowCount > 0 ? "text-red-500" : "text-green-500"}`}>{lowCount}</h2>
          <p className="text-xs text-gray-400 mt-1">KEL H+3 &lt; 90% minggu ini</p>
        </div>
      </div>

      {/* SUB NAV */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "overview", label: "📊 Trend Mingguan" },
          { key: "byarea", label: "🗺️ By Area" },
          { key: "bytas", label: "👤 By TAS" },
          { key: "low", label: `⚠️ Low Performer (${lowCount})` },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as typeof activeSection)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeSection === s.key ? "bg-teal-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* TREND MINGGUAN */}
      {activeSection === "overview" && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">Trend Mingguan Own Cloud</h3>
              <p className="text-xs text-gray-400 mt-0.5">Achievement rata-rata per minggu</p>
            </div>
            {/* Metric toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[{ key: "h3", label: "KEL H+3" }, { key: "h7", label: "KEL H+7" }, { key: "ach", label: "% Ach" }].map((m) => (
                <button key={m.key} onClick={() => setMetricView(m.key as typeof metricView)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${metricView === m.key ? "bg-white shadow text-teal-600" : "text-gray-500"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 200 }}>
            {weekStats.map((w) => {
              const val = metricView === "ach" ? w.ach : metricView === "h3" ? w.h3 : w.h7
              const color = val >= 0.98 ? "#14b8a6" : val >= 0.90 ? "#eab308" : "#ef4444"
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <span className={`text-xs font-semibold`} style={{ color }}>{(val * 100).toFixed(0)}%</span>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${(val / maxWeekVal) * 160}px`, backgroundColor: color }} />
                  <span className="text-xs text-gray-400">W{w.week}</span>
                  {/* Tooltip */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                    <p className="font-bold">Week {w.week}</p>
                    <p>H+3: {pct(w.h3)}</p>
                    <p>H+7: {pct(w.h7)}</p>
                    <p>Ach: {pct(w.ach)}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 justify-end text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500 inline-block"/>≥ 98%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block"/>90–98%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"/>&lt; 90%</span>
          </div>
        </div>
      )}

      {/* BY AREA */}
      {activeSection === "byarea" && (
        <div className="grid grid-cols-3 gap-4">
          {areaStats.map((a) => (
            <div key={a.area} className={`rounded-2xl border p-5 ${AREA_LIGHT[a.area] || "bg-gray-50"}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${AREA_COLORS[a.area] || "bg-gray-400"}`}>{a.area}</span>
                  <p className="text-xs text-gray-500 mt-1">{a.subdist} subdist</p>
                </div>
              </div>
              {/* 3 metric rows */}
              {[
                { label: "KEL H+3", val: a.h3 },
                { label: "KEL H+7", val: a.h7 },
                { label: "% Ach", val: a.ach },
              ].map((m) => (
                <div key={m.label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{m.label}</span>
                    <span className={`font-bold ${getAchColor(m.val)}`}>{pct(m.val)}</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: `${m.val * 100}%`, backgroundColor: m.val >= 0.98 ? "#14b8a6" : m.val >= 0.90 ? "#eab308" : "#ef4444" }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* BY TAS */}
      {activeSection === "bytas" && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Achievement per TAS</h3>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[{ key: "h3", label: "KEL H+3" }, { key: "h7", label: "KEL H+7" }, { key: "ach", label: "% Ach" }].map((m) => (
                <button key={m.key} onClick={() => setMetricView(m.key as typeof metricView)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${metricView === m.key ? "bg-white shadow text-teal-600" : "text-gray-500"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {tasStats.map((t, i) => {
              const val = metricView === "ach" ? t.ach : metricView === "h3" ? t.h3 : t.h7
              return (
                <div key={t.tas} className="flex items-center gap-3">
                  <div className="w-6 text-xs text-gray-400 text-right">{i + 1}</div>
                  <div className="w-24 text-sm font-medium">{t.tas}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden relative">
                    <div className="h-7 rounded-full flex items-center pl-2 transition-all"
                      style={{ width: `${Math.max(val * 100, 3)}%`, backgroundColor: val >= 0.98 ? "#14b8a6" : val >= 0.90 ? "#eab308" : "#ef4444" }}>
                      <span className="text-white text-xs font-semibold">{pct(val)}</span>
                    </div>
                  </div>
                  <div className="w-16 text-xs text-gray-400 text-right">{t.count} subdist</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LOW PERFORMER */}
      {activeSection === "low" && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Low Performer — Week {latestWeek}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Subdist dengan KEL H+3 &lt; 90%</p>
            </div>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">{lowPerformers.length} subdist</span>
          </div>
          {lowPerformers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-teal-600 font-medium">Semua subdist di atas 90%!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Nama Subdist</th>
                    <th className="px-3 py-2 text-left">Area</th>
                    <th className="px-3 py-2 text-left">TAS</th>
                    <th className="px-3 py-2 text-right">KEL H+3</th>
                    <th className="px-3 py-2 text-right">KEL H+7</th>
                    <th className="px-3 py-2 text-right">% Ach</th>
                  </tr>
                </thead>
                <tbody>
                  {lowPerformers.map((lp, i) => (
                    <tr key={i} className="border-t hover:bg-red-50">
                      <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-700 max-w-[200px] truncate">{lp.nama_subdist}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${AREA_LIGHT[lp.area] || "bg-gray-100"}`}>{lp.area}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{lp.tas}</td>
                      <td className="px-3 py-2 text-right"><span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(lp.h3)}`}>{pct(lp.h3)}</span></td>
                      <td className="px-3 py-2 text-right"><span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(lp.h7)}`}>{pct(lp.h7)}</span></td>
                      <td className="px-3 py-2 text-right"><span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(lp.ach)}`}>{pct(lp.ach)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABEL DATA LENGKAP */}
      <OCAppcDataTable data={filtered} />
    </div>
  )
}

function OCAppcDataTable({ data }: { data: OCRow[] }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortCol, setSortCol] = useState<"week" | "pct_kel_h3" | "nama_subdist">("week")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const PAGE_SIZE = 15

  const searched = data.filter((r) =>
    r.nama_subdist.toLowerCase().includes(search.toLowerCase()) ||
    r.tas.toLowerCase().includes(search.toLowerCase()) ||
    r.area.toLowerCase().includes(search.toLowerCase()) ||
    String(r.week).includes(search)
  )

  const sorted = [...searched].sort((a, b) => {
    const va = a[sortCol], vb = b[sortCol]
    if (va < vb) return sortDir === "asc" ? -1 : 1
    if (va > vb) return sortDir === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortCol(col); setSortDir("asc") }
    setPage(1)
  }

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span> : <span className="ml-1 opacity-30">↕</span>

  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold">Data Lengkap Own Cloud</h3>
          <p className="text-xs text-gray-400 mt-0.5">{searched.length.toLocaleString()} baris data</p>
        </div>
        <input
          type="text"
          placeholder="Cari subdist, TAS, area, week..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:border-teal-400"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-teal-500 to-green-500 text-white text-xs">
              <th className="px-3 py-3 text-left w-8">#</th>
              <th className="px-3 py-3 text-left cursor-pointer select-none" onClick={() => handleSort("nama_subdist")}>
                Nama Subdist <SortIcon col="nama_subdist" />
              </th>
              <th className="px-3 py-3 text-left">Divisi</th>
              <th className="px-3 py-3 text-left">Area</th>
              <th className="px-3 py-3 text-left">TAS</th>
              <th className="px-3 py-3 text-center">Periode</th>
              <th className="px-3 py-3 text-center cursor-pointer select-none" onClick={() => handleSort("week")}>
                Week <SortIcon col="week" />
              </th>
              <th className="px-3 py-3 text-right cursor-pointer select-none" onClick={() => handleSort("pct_kel_h3")}>
                KEL H+3 <SortIcon col="pct_kel_h3" />
              </th>
              <th className="px-3 py-3 text-right">KEL H+7</th>
              <th className="px-3 py-3 text-right">% Ach</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r, i) => (
              <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-teal-50`}>
                <td className="px-3 py-2 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-700 max-w-[200px] truncate">{r.nama_subdist}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">{r.divisi}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${AREA_LIGHT[r.area] || "bg-gray-100 text-gray-600"}`}>{r.area}</span>
                </td>
                <td className="px-3 py-2 text-gray-600 text-xs">{r.tas}</td>
                <td className="px-3 py-2 text-center text-gray-500 text-xs">P{r.periode}</td>
                <td className="px-3 py-2 text-center text-gray-500 text-xs">W{r.week}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(r.pct_kel_h3)}`}>{pct(r.pct_kel_h3)}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(r.pct_kel_h7)}`}>{pct(r.pct_kel_h7)}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(r.pct_ach)}`}>{pct(r.pct_ach)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">Halaman {page} dari {totalPages} ({sorted.length.toLocaleString()} baris)</p>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(1)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">«</button>
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">‹ Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              let p = idx + 1
              if (totalPages > 5 && page > 3) p = page - 2 + idx
              if (p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border text-xs ${p === page ? "bg-teal-500 text-white border-teal-500" : "hover:bg-gray-50"}`}>
                  {p}
                </button>
              )
            })}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">Next ›</button>
            <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">»</button>
          </div>
        </div>
      )}
    </div>
  )
}
