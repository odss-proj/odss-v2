"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

// PIC yang di-exclude
const EXCLUDED_PICS = ["ASWAN", "BRELY", "FAJRUL", "ACHMAD", "TAUFIK", "AANG", "IHSAN"]

type DTRow = {
  kode_subdist: number
  kd_plan: string
  nama_subdist: string
  cover: string
  pic: string
  bas: string
  assh: string
  area: string
  tahun: number
  periode: number
  week: number
  kpi: string
  pct_ach: number
}

type CoverStat = { cover: string; ach: number; subdist: number }
type PicStat = { pic: string; ach: number; count: number }
type WeekStat = { week: number; ach: number }
type LowPerformer = { nama_subdist: string; cover: string; pic: string; pct_ach: number }

const COVER_COLORS: Record<string, string> = {
  EAST: "bg-blue-500",
  WEST: "bg-green-500",
  CNS: "bg-purple-500",
  CENTRAL: "bg-orange-500",
}

const COVER_LIGHT: Record<string, string> = {
  EAST: "bg-blue-50 border-blue-200 text-blue-700",
  WEST: "bg-green-50 border-green-200 text-green-700",
  CNS: "bg-purple-50 border-purple-200 text-purple-700",
  CENTRAL: "bg-orange-50 border-orange-200 text-orange-700",
}

function getAchColor(ach: number) {
  if (ach >= 0.98) return "text-green-600"
  if (ach >= 0.95) return "text-yellow-600"
  return "text-red-500"
}

function getAchBg(ach: number) {
  if (ach >= 0.98) return "bg-green-100 text-green-700"
  if (ach >= 0.95) return "bg-yellow-100 text-yellow-700"
  return "bg-red-100 text-red-600"
}

function pct(val: number) {
  return (val * 100).toFixed(2) + "%"
}

function DataTable({ data }: { data: DTRow[] }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortCol, setSortCol] = useState<"week" | "pct_ach" | "nama_subdist">("week")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const PAGE_SIZE = 15

  const searched = data.filter((r) =>
    r.nama_subdist.toLowerCase().includes(search.toLowerCase()) ||
    r.pic.toLowerCase().includes(search.toLowerCase()) ||
    r.cover.toLowerCase().includes(search.toLowerCase()) ||
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
          <h3 className="font-semibold">Data Lengkap DT Transfer</h3>
          <p className="text-xs text-gray-400 mt-0.5">{searched.length.toLocaleString()} baris data</p>
        </div>
        <input
          type="text"
          placeholder="Cari subdist, PIC, cover, week..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:border-green-400"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs">
              <th className="px-3 py-3 text-left w-8">#</th>
              <th className="px-3 py-3 text-left cursor-pointer select-none" onClick={() => handleSort("nama_subdist")}>
                Nama Subdist <SortIcon col="nama_subdist" />
              </th>
              <th className="px-3 py-3 text-left">Cover</th>
              <th className="px-3 py-3 text-left">PIC</th>
              <th className="px-3 py-3 text-left">Area</th>
              <th className="px-3 py-3 text-center">Periode</th>
              <th className="px-3 py-3 text-center cursor-pointer select-none" onClick={() => handleSort("week")}>
                Week <SortIcon col="week" />
              </th>
              <th className="px-3 py-3 text-right cursor-pointer select-none" onClick={() => handleSort("pct_ach")}>
                Achievement <SortIcon col="pct_ach" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r, i) => (
              <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50`}>
                <td className="px-3 py-2 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-700 max-w-[220px] truncate">{r.nama_subdist}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${COVER_LIGHT[r.cover] || "bg-gray-100 text-gray-600"}`}>{r.cover}</span>
                </td>
                <td className="px-3 py-2 text-gray-600 text-xs">{r.pic}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">{r.area}</td>
                <td className="px-3 py-2 text-center text-gray-500 text-xs">P{r.periode}</td>
                <td className="px-3 py-2 text-center text-gray-500 text-xs">W{r.week}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(r.pct_ach)}`}>{pct(r.pct_ach)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
                  className={`px-3 py-1.5 rounded-lg border text-xs ${p === page ? "bg-green-500 text-white border-green-500" : "hover:bg-gray-50"}`}>
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

export default function DTTransferView() {
  const [data, setData] = useState<DTRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterCover, setFilterCover] = useState("ALL")
  const [filterPeriode, setFilterPeriode] = useState("ALL")
  const [activeSection, setActiveSection] = useState<"overview" | "bypic" | "bycover" | "low">("overview")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Supabase limit 1000/request — fetch semua dengan pagination
      let allRows: Record<string, unknown>[] = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: rows, error: err } = await supabase
          .from("dt_transfer")
          .select("*")
          .order("week", { ascending: true })
          .range(from, from + pageSize - 1)

        if (err) {
          setError("Gagal mengambil data: " + err.message)
          setLoading(false)
          return
        }

        if (!rows || rows.length === 0) break
        allRows = [...allRows, ...rows]
        if (rows.length < pageSize) break
        from += pageSize
      }

      // normalize kolom nama — kolom di Supabase: 'ach' (nilai 0-100)
      const normalized = allRows.map((r: Record<string, unknown>) => {
        // Kolom di Supabase bernama 'ach', nilainya 0-100 (bukan desimal)
        const achRaw = Number(r["ach"] ?? 0)
        // Bagi 100 karena tersimpan sebagai persen penuh (misal 97.5 bukan 0.975)
        const achValue = achRaw / 100

        return {
          kode_subdist: Number(r["kode_subdist"] ?? 0),
          kd_plan: String(r["kd_plan"] ?? ""),
          nama_subdist: String(r["nama_subdist"] ?? ""),
          cover: String(r["cover"] ?? "").toUpperCase().trim(),
          pic: String(r["pic"] ?? "").toUpperCase().trim(),
          bas: String(r["bas"] ?? ""),
          assh: String(r["assh"] ?? ""),
          area: String(r["area"] ?? ""),
          tahun: Number(r["tahun"] ?? 0),
          periode: Number(r["periode"] ?? 0),
          week: Number(r["week"] ?? 0),
          kpi: String(r["kpi"] ?? ""),
          pct_ach: Number(achValue),
        }
      })

      // Exclude CNS cover dan PIC tertentu
      const filtered_raw = normalized.filter(
        (r) => r.cover !== "CNS" && !EXCLUDED_PICS.includes(r.pic)
      )
      setData(filtered_raw)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filtered data
  const filtered = data.filter((r) => {
    if (filterCover !== "ALL" && r.cover !== filterCover) return false
    if (filterPeriode !== "ALL" && String(r.periode) !== filterPeriode) return false
    return true
  })

  // Computed stats
  const overall = filtered.length > 0
    ? filtered.reduce((s, r) => s + r.pct_ach, 0) / filtered.length
    : 0

  const latestWeek = filtered.length > 0 ? Math.max(...filtered.map((r) => r.week)) : 0
  const latestData = filtered.filter((r) => r.week === latestWeek)
  const latestAch = latestData.length > 0
    ? latestData.reduce((s, r) => s + r.pct_ach, 0) / latestData.length
    : 0

  const totalSubdist = new Set(filtered.map((r) => r.kode_subdist)).size

  const lowCount = latestData.filter((r) => r.pct_ach < 0.95).length

  // By cover
  const covers = ["EAST", "WEST", "CENTRAL"]
  const coverStats: CoverStat[] = covers.map((cov) => {
    const rows = filtered.filter((r) => r.cover === cov)
    return {
      cover: cov,
      ach: rows.length > 0 ? rows.reduce((s, r) => s + r.pct_ach, 0) / rows.length : 0,
      subdist: new Set(rows.map((r) => r.kode_subdist)).size,
    }
  }).filter((c) => c.subdist > 0)

  // By PIC
  const pics = [...new Set(filtered.map((r) => r.pic))].filter(Boolean)
  const picStats: PicStat[] = pics.map((pic) => {
    const rows = filtered.filter((r) => r.pic === pic)
    return {
      pic,
      ach: rows.reduce((s, r) => s + r.pct_ach, 0) / rows.length,
      count: new Set(rows.map((r) => r.kode_subdist)).size,
    }
  }).sort((a, b) => b.ach - a.ach)

  // Weekly trend
  const weeks = [...new Set(filtered.map((r) => r.week))].sort((a, b) => a - b)
  const weekStats: WeekStat[] = weeks.map((w) => {
    const rows = filtered.filter((r) => r.week === w)
    return { week: w, ach: rows.reduce((s, r) => s + r.pct_ach, 0) / rows.length }
  })

  const maxWeekAch = Math.max(...weekStats.map((w) => w.ach), 1)

  // Low performers latest week
  const lowPerformers: LowPerformer[] = latestData
    .filter((r) => r.pct_ach < 0.95)
    .sort((a, b) => a.pct_ach - b.pct_ach)
    .slice(0, 20)
    .map((r) => ({ nama_subdist: r.nama_subdist, cover: r.cover, pic: r.pic, pct_ach: r.pct_ach }))

  const periodes = [...new Set(data.map((r) => String(r.periode)))].sort()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Memuat data DT Transfer...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <p className="text-red-500 text-sm">⚠️ {error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <p className="text-gray-400 text-sm">📭 Belum ada data. Superadmin perlu upload terlebih dahulu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* FILTER BAR */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-2xl border">
        <span className="text-sm font-medium text-gray-500">Filter:</span>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "EAST", "WEST", "CENTRAL"].map((c) => (
            <button key={c} onClick={() => setFilterCover(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filterCover === c ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-500 border-gray-200 hover:border-green-300"
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterPeriode("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              filterPeriode === "ALL" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
            }`}>Semua Periode</button>
          {periodes.map((p) => (
            <button key={p} onClick={() => setFilterPeriode(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filterPeriode === p ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
              }`}>
              P{p}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-400">{filtered.length.toLocaleString()} records</div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Overall Achievement</p>
          <h2 className={`text-3xl font-bold ${getAchColor(overall)}`}>{pct(overall)}</h2>
          <p className="text-xs text-gray-400 mt-1">Rata-rata seluruh data</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Achievement Week {latestWeek}</p>
          <h2 className={`text-3xl font-bold ${getAchColor(latestAch)}`}>{pct(latestAch)}</h2>
          <p className="text-xs text-gray-400 mt-1">Minggu terkini</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Total Subdist</p>
          <h2 className="text-3xl font-bold text-gray-800">{totalSubdist}</h2>
          <p className="text-xs text-gray-400 mt-1">Subdistributor aktif</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Low Performer</p>
          <h2 className={`text-3xl font-bold ${lowCount > 0 ? "text-red-500" : "text-green-500"}`}>{lowCount}</h2>
          <p className="text-xs text-gray-400 mt-1">ACH &lt; 95% minggu ini</p>
        </div>
      </div>

      {/* SUB NAV */}
      <div className="flex gap-2">
        {[
          { key: "overview", label: "📊 Trend Mingguan" },
          { key: "bycover", label: "🗺️ By Cover" },
          { key: "bypic", label: "👤 By PIC" },
          { key: "low", label: `⚠️ Low Performer (${lowCount})` },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as typeof activeSection)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeSection === s.key ? "bg-green-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* TREND MINGGUAN */}
      {activeSection === "overview" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-1">Trend Achievement Mingguan</h3>
          <p className="text-xs text-gray-400 mb-5">Achievement rata-rata per minggu ({filterCover !== "ALL" ? filterCover : "Semua Cover"})</p>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {weekStats.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-xs font-semibold ${getAchColor(w.ach)}`}>
                  {(w.ach * 100).toFixed(0)}%
                </span>
                <div className="w-full rounded-t-md transition-all relative group"
                  style={{
                    height: `${(w.ach / maxWeekAch) * 160}px`,
                    backgroundColor: w.ach >= 0.98 ? "#22c55e" : w.ach >= 0.95 ? "#eab308" : "#ef4444",
                  }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                    W{w.week}: {pct(w.ach)}
                  </div>
                </div>
                <span className="text-xs text-gray-400">W{w.week}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-end text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/>≥ 98%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block"/>95–98%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"/>&lt; 95%</span>
          </div>
        </div>
      )}

      {/* BY COVER */}
      {activeSection === "bycover" && (
        <div className="grid grid-cols-2 gap-4">
          {coverStats.map((c) => (
            <div key={c.cover} className={`rounded-2xl border p-5 ${COVER_LIGHT[c.cover] || "bg-gray-50"}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${COVER_COLORS[c.cover] || "bg-gray-400"}`}>
                    {c.cover}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{c.subdist} subdist</p>
                </div>
                <span className={`text-2xl font-bold ${getAchColor(c.ach)}`}>{pct(c.ach)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full transition-all"
                  style={{
                    width: `${c.ach * 100}%`,
                    backgroundColor: c.ach >= 0.98 ? "#22c55e" : c.ach >= 0.95 ? "#eab308" : "#ef4444",
                  }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span><span>Target 98%</span><span>100%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BY PIC */}
      {activeSection === "bypic" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Achievement per PIC</h3>
          <div className="space-y-3">
            {picStats.map((p, i) => (
              <div key={p.pic} className="flex items-center gap-3">
                <div className="w-6 text-xs text-gray-400 text-right">{i + 1}</div>
                <div className="w-24 text-sm font-medium truncate">{p.pic}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                  <div className="h-6 rounded-full flex items-center pl-2 transition-all"
                    style={{
                      width: `${p.ach * 100}%`,
                      backgroundColor: p.ach >= 0.98 ? "#22c55e" : p.ach >= 0.95 ? "#eab308" : "#ef4444",
                    }}>
                    <span className="text-white text-xs font-semibold">{pct(p.ach)}</span>
                  </div>
                </div>
                <div className="w-16 text-xs text-gray-400 text-right">{p.count} subdist</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOW PERFORMER */}
      {activeSection === "low" && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Low Performer — Week {latestWeek}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Subdist dengan Achievement &lt; 95%</p>
            </div>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
              {lowPerformers.length} subdist
            </span>
          </div>
          {lowPerformers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-green-600 font-medium">Semua subdist di atas 95%!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Nama Subdist</th>
                    <th className="px-3 py-2 text-left">Cover</th>
                    <th className="px-3 py-2 text-left">PIC</th>
                    <th className="px-3 py-2 text-right">Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {lowPerformers.map((lp, i) => (
                    <tr key={i} className="border-t hover:bg-red-50">
                      <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-700 max-w-[250px] truncate">{lp.nama_subdist}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${COVER_LIGHT[lp.cover] || "bg-gray-100 text-gray-600"}`}>
                          {lp.cover}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{lp.pic}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${getAchBg(lp.pct_ach)}`}>
                          {pct(lp.pct_ach)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABEL DATA LENGKAP */}
      <DataTable data={filtered} />
    </div>
  )
}
