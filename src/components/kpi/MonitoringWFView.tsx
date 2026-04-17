"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const EXCLUDED_TAS = ["ASWAN", "BRELY", "FAJRUL", "ACHMAD", "TAUFIK", "AANG", "IHSAN"]

type WFRow = {
  subdis_id: number
  subdis_name: string
  divisi: string
  type: string
  kota: string
  region: string
  tas: string
  release: number
  lama: number
  pekan: number
  prosentase: number
}

type RegionStat = { region: string; ach: number; ontime: number; late: number; subdist: number }
type TasStat = { tas: string; ach: number; ontime: number; late: number; count: number }
type WeekStat = { pekan: number; ach: number; ontime: number; total: number }
type LowRow = { subdis_name: string; region: string; tas: string; lama: number; prosentase: number }

const REGION_COLORS: Record<string, string> = {
  EAST: "bg-blue-500", WEST: "bg-green-500", CENTRAL: "bg-orange-500",
}
const REGION_LIGHT: Record<string, string> = {
  EAST: "bg-blue-50 border-blue-200 text-blue-700",
  WEST: "bg-green-50 border-green-200 text-green-700",
  CENTRAL: "bg-orange-50 border-orange-200 text-orange-700",
}

function getAchColor(v: number) {
  if (v >= 0.98) return "text-green-600"
  if (v >= 0.95) return "text-yellow-600"
  return "text-red-500"
}
function getAchBg(v: number) {
  if (v >= 0.98) return "bg-green-100 text-green-700"
  if (v >= 0.95) return "bg-yellow-100 text-yellow-700"
  return "bg-red-100 text-red-600"
}
function getLamaBg(v: number) {
  // LAMA = TGL Transfer - Cut Off
  // LAMA < 0 → transfer SETELAH cut off (terlambat dari cut off, tapi tetap dihitung)
  // LAMA = 0 → tepat di cut off
  // LAMA > 0 → transfer SEBELUM cut off (lebih awal)
  if (v === 0) return "bg-green-100 text-green-700"
  if (v < 0) return "bg-yellow-100 text-yellow-700"   // setelah cut off
  return "bg-blue-100 text-blue-700"                    // sebelum cut off (lebih awal)
}
function pct(v: number) { return (v * 100).toFixed(2) + "%" }
function avg(arr: number[]) { return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }

export default function MonitoringWFView() {
  const [data, setData] = useState<WFRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterRegion, setFilterRegion] = useState("ALL")
  const [filterPekan, setFilterPekan] = useState("ALL")
  const [activeSection, setActiveSection] = useState<"overview" | "byregion" | "bytas" | "low">("overview")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let allRows: Record<string, unknown>[] = []
      let from = 0
      const pageSize = 1000

      while (true) {
        const { data: rows, error: err } = await supabase
          .from("monitoring_wf")
          .select("*")
          .order("pekan", { ascending: true })
          .range(from, from + pageSize - 1)

        if (err) { setError("Gagal mengambil data: " + err.message); setLoading(false); return }
        if (!rows || rows.length === 0) break
        allRows = [...allRows, ...rows]
        if (rows.length < pageSize) break
        from += pageSize
      }

      const normalized = allRows.map((r) => {
        const pRaw = Number(r["prosentase"] ?? r["persentase"] ?? 0)
        return {
          subdis_id: Number(r["subdis_id"] ?? 0),
          subdis_name: String(r["subdis_name"] ?? ""),
          divisi: String(r["divisi"] ?? ""),
          type: String(r["type"] ?? ""),
          kota: String(r["kota"] ?? ""),
          region: String(r["region"] ?? "").toUpperCase().trim(),
          tas: String(r["tas"] ?? "").toUpperCase().trim(),
          release: Number(r["release"] ?? 0),
          lama: Number(r["lama"] ?? 0),
          pekan: Number(r["pekan"] ?? 0),
          prosentase: pRaw > 1 ? pRaw / 100 : pRaw,
        } as WFRow
      })

      const filtered_raw = normalized.filter(
        (r) => r.region !== "CNS" && !EXCLUDED_TAS.includes(r.tas)
      )
      setData(filtered_raw)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = data.filter((r) => {
    if (filterRegion !== "ALL" && r.region !== filterRegion) return false
    if (filterPekan !== "ALL" && String(r.pekan) !== filterPekan) return false
    return true
  })

  const overallAch = avg(filtered.map((r) => r.prosentase))
  const avgLama = avg(filtered.map((r) => r.lama))
  const latestPekan = filtered.length > 0 ? Math.max(...filtered.map((r) => r.pekan)) : 0
  const latestData = filtered.filter((r) => r.pekan === latestPekan)
  const latestAch = avg(latestData.map((r) => r.prosentase))
  const totalSubdist = new Set(filtered.map((r) => r.subdis_id)).size
  const lowCount = latestData.filter((r) => r.prosentase < 0.95).length
  const ontimeCount = filtered.filter((r) => r.lama <= 0).length   // setelah/tepat cut off = sudah transfer
  const earlyCount = filtered.filter((r) => r.lama > 0).length      // sebelum cut off = belum/lebih awal

  // By region
  const regionStats: RegionStat[] = ["EAST", "WEST", "CENTRAL"].map((region) => {
    const rows = filtered.filter((r) => r.region === region)
    return {
      region,
      ach: avg(rows.map((r) => r.prosentase)),
      ontime: rows.filter((r) => r.lama <= 0).length,   // setelah/tepat cut off
      late: rows.filter((r) => r.lama > 0).length,       // sebelum cut off (lebih awal)
      subdist: new Set(rows.map((r) => r.subdis_id)).size,
    }
  }).filter((r) => r.subdist > 0)

  // By TAS
  const tasStats: TasStat[] = [...new Set(filtered.map((r) => r.tas))].filter(Boolean).map((tas) => {
    const rows = filtered.filter((r) => r.tas === tas)
    return {
      tas,
      ach: avg(rows.map((r) => r.prosentase)),
      ontime: rows.filter((r) => r.lama <= 0).length,
      late: rows.filter((r) => r.lama > 0).length,
      count: new Set(rows.map((r) => r.subdis_id)).size,
    }
  }).sort((a, b) => b.ach - a.ach)

  // Weekly trend
  const pekans = [...new Set(filtered.map((r) => r.pekan))].sort((a, b) => a - b)
  const weekStats: WeekStat[] = pekans.map((p) => {
    const rows = filtered.filter((r) => r.pekan === p)
    return {
      pekan: p,
      ach: avg(rows.map((r) => r.prosentase)),
      ontime: rows.filter((r) => r.lama >= 0).length,
      total: rows.length,
    }
  })

  // Low performers
  const lowPerformers: LowRow[] = latestData
    .filter((r) => r.prosentase < 0.95)
    .sort((a, b) => a.prosentase - b.prosentase)
    .slice(0, 20)
    .map((r) => ({ subdis_name: r.subdis_name, region: r.region, tas: r.tas, lama: r.lama, prosentase: r.prosentase }))

  const pekansAll = [...new Set(data.map((r) => String(r.pekan)))].sort((a, b) => Number(a) - Number(b))
  const maxWeekAch = Math.max(...weekStats.map((w) => w.ach), 0.01)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Memuat data Monitoring WF...</p>
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
        <div className="flex gap-2">
          {["ALL", "EAST", "WEST", "CENTRAL"].map((r) => (
            <button key={r} onClick={() => setFilterRegion(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterRegion === r ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterPekan("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterPekan === "ALL" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
            Semua Pekan
          </button>
          {pekansAll.map((p) => (
            <button key={p} onClick={() => setFilterPekan(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterPekan === p ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
              P{p}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-400">{filtered.length.toLocaleString()} records</div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Overall Achievement</p>
          <h2 className={`text-3xl font-bold ${getAchColor(overallAch)}`}>{pct(overallAch)}</h2>
          <p className="text-xs text-gray-400 mt-1">Rata-rata semua pekan</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Achievement Pekan {latestPekan}</p>
          <h2 className={`text-3xl font-bold ${getAchColor(latestAch)}`}>{pct(latestAch)}</h2>
          <p className="text-xs text-gray-400 mt-1">Pekan terkini</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Rata-rata Selisih Transfer</p>
          <h2 className={`text-3xl font-bold ${avgLama < 0 ? "text-yellow-600" : avgLama === 0 ? "text-green-600" : "text-blue-500"}`}>
            {avgLama >= 0 ? "+" : ""}{avgLama.toFixed(1)} hari
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            ✅ {ontimeCount.toLocaleString()} sudah transfer &nbsp;|&nbsp; 🔵 {earlyCount.toLocaleString()} lebih awal
          </p>
          <p className="text-xs text-blue-400 mt-0.5">- = setelah cut off &nbsp;|&nbsp; + = sebelum cut off</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <p className="text-xs text-gray-400 mb-1">Low Performer</p>
          <h2 className={`text-3xl font-bold ${lowCount > 0 ? "text-red-500" : "text-green-500"}`}>{lowCount}</h2>
          <p className="text-xs text-gray-400 mt-1">ACH &lt; 95% pekan ini</p>
        </div>
      </div>

      {/* SUB NAV */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "overview", label: "📊 Trend Pekan" },
          { key: "byregion", label: "🗺️ By Region" },
          { key: "bytas", label: "👤 By TAS" },
          { key: "low", label: `⚠️ Low Performer (${lowCount})` },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key as typeof activeSection)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeSection === s.key ? "bg-indigo-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* TREND PEKAN */}
      {activeSection === "overview" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-1">Trend Achievement per Pekan</h3>
          <p className="text-xs text-gray-400 mb-5">Achievement rata-rata setiap pekan ({filterRegion !== "ALL" ? filterRegion : "Semua Region"})</p>
          <div className="flex items-end gap-1.5" style={{ height: 200 }}>
            {weekStats.map((w) => {
              const color = w.ach >= 0.98 ? "#6366f1" : w.ach >= 0.95 ? "#eab308" : "#ef4444"
              return (
                <div key={w.pekan} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <span className="text-xs font-semibold" style={{ color }}>{(w.ach * 100).toFixed(0)}%</span>
                  <div className="w-full rounded-t-md transition-all"
                    style={{ height: `${(w.ach / maxWeekAch) * 160}px`, backgroundColor: color }} />
                  <span className="text-xs text-gray-400">P{w.pekan}</span>
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                    <p className="font-bold">Pekan {w.pekan}</p>
                    <p>ACH: {pct(w.ach)}</p>
                    <p>Tepat waktu: {w.ontime}/{w.total}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 justify-end text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500 inline-block"/>≥ 98%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block"/>95–98%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"/>&lt; 95%</span>
          </div>
        </div>
      )}

      {/* BY REGION */}
      {activeSection === "byregion" && (
        <div className="grid grid-cols-3 gap-4">
          {regionStats.map((r) => (
            <div key={r.region} className={`rounded-2xl border p-5 ${REGION_LIGHT[r.region] || "bg-gray-50"}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${REGION_COLORS[r.region] || "bg-gray-400"}`}>{r.region}</span>
                  <p className="text-xs text-gray-500 mt-1">{r.subdist} subdist</p>
                </div>
                <span className={`text-2xl font-bold ${getAchColor(r.ach)}`}>{pct(r.ach)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white rounded-full h-2.5 overflow-hidden mb-3">
                <div className="h-2.5 rounded-full" style={{ width: `${r.ach * 100}%`, backgroundColor: r.ach >= 0.98 ? "#6366f1" : r.ach >= 0.95 ? "#eab308" : "#ef4444" }} />
              </div>
              {/* Ontime vs Late */}
              <div className="flex gap-3 text-xs">
                <div className="flex-1 bg-white rounded-xl p-2 text-center">
                  <p className="text-green-600 font-bold text-lg">{r.ontime.toLocaleString()}</p>
                  <p className="text-gray-400">✅ Sudah transfer</p>
                </div>
                <div className="flex-1 bg-white rounded-xl p-2 text-center">
                  <p className="text-blue-500 font-bold text-lg">{r.late.toLocaleString()}</p>
                  <p className="text-gray-400">🔵 Lebih awal</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BY TAS */}
      {activeSection === "bytas" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Achievement per TAS</h3>
          <div className="space-y-3">
            {tasStats.map((t, i) => (
              <div key={t.tas} className="flex items-center gap-3">
                <div className="w-6 text-xs text-gray-400 text-right">{i + 1}</div>
                <div className="w-24 text-sm font-medium">{t.tas}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden relative">
                  <div className="h-7 rounded-full flex items-center pl-2 transition-all"
                    style={{ width: `${Math.max(t.ach * 100, 3)}%`, backgroundColor: t.ach >= 0.98 ? "#6366f1" : t.ach >= 0.95 ? "#eab308" : "#ef4444" }}>
                    <span className="text-white text-xs font-semibold">{pct(t.ach)}</span>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-green-600">✅{t.ontime.toLocaleString()}</span>
                  <span className="text-blue-400">🔵{t.late.toLocaleString()}</span>
                </div>
                <div className="w-16 text-xs text-gray-400 text-right">{t.count} subdist</div>
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
              <h3 className="font-semibold">Low Performer — Pekan {latestPekan}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Subdist dengan Achievement &lt; 95%</p>
            </div>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">{lowPerformers.length} subdist</span>
          </div>
          {lowPerformers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-indigo-600 font-medium">Semua subdist di atas 95%!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Nama Subdist</th>
                    <th className="px-3 py-2 text-left">Region</th>
                    <th className="px-3 py-2 text-left">TAS</th>
                    <th className="px-3 py-2 text-right">Keterlambatan</th>
                    <th className="px-3 py-2 text-right">Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {lowPerformers.map((lp, i) => (
                    <tr key={i} className="border-t hover:bg-red-50">
                      <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-700 max-w-[220px] truncate">{lp.subdis_name}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${REGION_LIGHT[lp.region] || "bg-gray-100"}`}>{lp.region}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{lp.tas}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getLamaBg(lp.lama)}`}>
                          {lp.lama >= 0 ? `+${lp.lama}` : lp.lama} hari
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(lp.prosentase)}`}>{pct(lp.prosentase)}</span>
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
      <WFDataTable data={filtered} />
    </div>
  )
}

function WFDataTable({ data }: { data: WFRow[] }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortCol, setSortCol] = useState<"pekan" | "prosentase" | "lama" | "subdis_name">("pekan")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const PAGE_SIZE = 15

  const searched = data.filter((r) =>
    r.subdis_name.toLowerCase().includes(search.toLowerCase()) ||
    r.tas.toLowerCase().includes(search.toLowerCase()) ||
    r.region.toLowerCase().includes(search.toLowerCase()) ||
    r.kota.toLowerCase().includes(search.toLowerCase()) ||
    String(r.pekan).includes(search)
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
          <h3 className="font-semibold">Data Lengkap Monitoring WF</h3>
          <p className="text-xs text-gray-400 mt-0.5">{searched.length.toLocaleString()} baris data</p>
        </div>
        <input
          type="text"
          placeholder="Cari subdist, TAS, region, kota..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs">
              <th className="px-3 py-3 text-left w-8">#</th>
              <th className="px-3 py-3 text-left cursor-pointer select-none" onClick={() => handleSort("subdis_name")}>
                Nama Subdist <SortIcon col="subdis_name" />
              </th>
              <th className="px-3 py-3 text-left">Divisi</th>
              <th className="px-3 py-3 text-left">Region</th>
              <th className="px-3 py-3 text-left">TAS</th>
              <th className="px-3 py-3 text-left">Kota</th>
              <th className="px-3 py-3 text-center cursor-pointer select-none" onClick={() => handleSort("pekan")}>
                Pekan <SortIcon col="pekan" />
              </th>
              <th className="px-3 py-3 text-right cursor-pointer select-none" onClick={() => handleSort("lama")}>
                Keterlambatan <SortIcon col="lama" />
              </th>
              <th className="px-3 py-3 text-right cursor-pointer select-none" onClick={() => handleSort("prosentase")}>
                Achievement <SortIcon col="prosentase" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r, i) => (
              <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-50`}>
                <td className="px-3 py-2 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-700 max-w-[200px] truncate">{r.subdis_name}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">{r.divisi}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${REGION_LIGHT[r.region] || "bg-gray-100 text-gray-600"}`}>{r.region}</span>
                </td>
                <td className="px-3 py-2 text-gray-600 text-xs">{r.tas}</td>
                <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[100px]">{r.kota}</td>
                <td className="px-3 py-2 text-center text-gray-500 text-xs">P{r.pekan}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getLamaBg(r.lama)}`}>
                    {r.lama >= 0 ? `+${r.lama}` : r.lama} hari
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${getAchBg(r.prosentase)}`}>{pct(r.prosentase)}</span>
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
                  className={`px-3 py-1.5 rounded-lg border text-xs ${p === page ? "bg-indigo-500 text-white border-indigo-500" : "hover:bg-gray-50"}`}>
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
