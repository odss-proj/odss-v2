"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const MDM_TEAM = ["LIA", "IRHANDY", "KUNCORO", "MECHELL", "WIRA", "MAULANA", "MISEL"]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  OK:     { label: "OK",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",  dot: "bg-emerald-500" },
  OKE:    { label: "OK",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",  dot: "bg-emerald-500" },
  BATAL:  { label: "Batal",  color: "text-red-700",     bg: "bg-red-50 border-red-200",          dot: "bg-red-500" },
  CANCEL: { label: "Cancel", color: "text-red-700",     bg: "bg-red-50 border-red-200",          dot: "bg-red-500" },
  REV:    { label: "Revisi", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",      dot: "bg-amber-500" },
  REV2:   { label: "Rev 2",  color: "text-orange-700",  bg: "bg-orange-50 border-orange-200",    dot: "bg-orange-500" },
}

const KATEGORI_COLORS: Record<string, string> = {
  "PROMO/DISK":     "bg-violet-100 text-violet-700",
  "LAIN LAIN":      "bg-gray-100 text-gray-600",
  "REGULER DISC":   "bg-blue-100 text-blue-700",
  "PRODUCT LAUNCH": "bg-green-100 text-green-700",
  "PRICE":          "bg-orange-100 text-orange-700",
  "MASTER HO":      "bg-pink-100 text-pink-700",
  "TOP":            "bg-yellow-100 text-yellow-700",
  "INCENTIVE":      "bg-teal-100 text-teal-700",
}

type Row = {
  id: string
  no: number
  kode_ap: string
  deskripsi: string
  jml_setting: number
  from: string
  kategori: string
  type: string
  bobot_setting: number
  div: string
  sub_div: string
  level: string
  tgl_email: string
  tgl_awal_program: string
  tgl_akhir_program: string
  tgl_setting: string
  pic_setting: string
  status: string
  tgl_controller: string
  pic_controller: string
  status_controller: string
  note_controller: string
  tgl_release: string
  pic_release: string
  status_release: string
  note_release: string
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100 border-gray-200", dot: "bg-gray-400" }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function KategoriBadge({ kategori }: { kategori: string }) {
  const key = Object.keys(KATEGORI_COLORS).find(k => kategori?.toUpperCase().includes(k)) ?? ""
  const cls = KATEGORI_COLORS[key] ?? "bg-gray-100 text-gray-600"
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{kategori}</span>
}

const PAGE_SIZE = 15

export default function MonitoringSettingView() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [filterPic, setFilterPic]       = useState("ALL")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterKat, setFilterKat]       = useState("ALL")
  const [filterType, setFilterType]     = useState("ALL")
  const [search, setSearch]             = useState("")
  const [page, setPage]                 = useState(1)
  const [activeSection, setActiveSection] = useState<"overview" | "bypic" | "table">("overview")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let all: Record<string, unknown>[] = []
      let from = 0
      while (true) {
        const { data: rows, error: err } = await supabase
          .from("mdm_monitoring_setting")
          .select("*")
          .range(from, from + 999)
        if (err) { setError("Gagal mengambil data: " + err.message); setLoading(false); return }
        if (!rows || rows.length === 0) break
        all = [...all, ...rows]
        if (rows.length < 1000) break
        from += 1000
      }
      setData(all.map(r => ({
        id: String(r.id ?? ""),
        no: Number(r.no ?? 0),
        kode_ap: String(r.kode_ap ?? ""),
        deskripsi: String(r.deskripsi ?? ""),
        jml_setting: Number(r.jml_setting ?? 0),
        from: String(r.from ?? ""),
        kategori: String(r.kategori ?? ""),
        type: String(r.type ?? ""),
        bobot_setting: Number(r.bobot_setting ?? 0),
        div: String(r.div ?? ""),
        sub_div: String(r.sub_div ?? ""),
        level: String(r.level ?? ""),
        tgl_email: String(r.tgl_email ?? ""),
        tgl_awal_program: String(r.tgl_awal_program ?? ""),
        tgl_akhir_program: String(r.tgl_akhir_program ?? ""),
        tgl_setting: String(r.tgl_setting ?? ""),
        pic_setting: String(r.pic_setting ?? "").toUpperCase().trim(),
        status: String(r.status ?? ""),
        tgl_controller: String(r.tgl_controller ?? ""),
        pic_controller: String(r.pic_controller ?? ""),
        status_controller: String(r.status_controller ?? ""),
        note_controller: String(r.note_controller ?? ""),
        tgl_release: String(r.tgl_release ?? ""),
        pic_release: String(r.pic_release ?? ""),
        status_release: String(r.status_release ?? ""),
        note_release: String(r.note_release ?? ""),
      } as Row)))
      setLoading(false)
    }
    fetchData()
  }, [])

  // Normalize kategori
  const normalize = (s: string) => s?.toUpperCase().trim()
    .replace(/PROMO\/DISK$/, "PROMO/DISK").replace(/REGULER.*/,"REGULER DISC")
    .replace(/PRODUCT LAU.*/,"PRODUCT LAUNCH").replace(/LAIN.*/,"LAIN LAIN") ?? s

  const filtered = data.filter(r => {
    if (filterPic !== "ALL" && r.pic_setting !== filterPic) return false
    if (filterStatus !== "ALL" && (r.status?.toUpperCase() !== filterStatus)) return false
    if (filterKat !== "ALL" && normalize(r.kategori) !== filterKat) return false
    if (filterType !== "ALL" && r.type?.toUpperCase().replace(/ /g,"_") !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return r.kode_ap.toLowerCase().includes(q) || r.deskripsi.toLowerCase().includes(q) || r.pic_setting.toLowerCase().includes(q)
    }
    return true
  })

  // KPI stats
  const total       = filtered.length
  const totalOK     = filtered.filter(r => ["OK","OKE"].includes(r.status?.toUpperCase())).length
  const totalBatal  = filtered.filter(r => ["BATAL","CANCEL"].includes(r.status?.toUpperCase())).length
  const totalRev    = filtered.filter(r => r.status?.toUpperCase().startsWith("REV")).length
  const totalJml    = filtered.reduce((a,r) => a + (r.jml_setting||0), 0)
  const totalBobot  = filtered.reduce((a,r) => a + (r.bobot_setting||0), 0)

  // By PIC
  const picStats = MDM_TEAM.map(pic => {
    const rows = filtered.filter(r => r.pic_setting === pic)
    if (!rows.length) return null
    return {
      pic,
      total: rows.length,
      ok: rows.filter(r => ["OK","OKE"].includes(r.status?.toUpperCase())).length,
      batal: rows.filter(r => ["BATAL","CANCEL"].includes(r.status?.toUpperCase())).length,
      rev: rows.filter(r => r.status?.toUpperCase().startsWith("REV")).length,
      jml: rows.reduce((a,r) => a + (r.jml_setting||0), 0),
      bobot: rows.reduce((a,r) => a + (r.bobot_setting||0), 0),
    }
  }).filter(Boolean).sort((a,b) => b!.total - a!.total) as NonNullable<ReturnType<typeof MDM_TEAM.map>[number]>[]

  // By Kategori
  const katStats = Object.entries(
    filtered.reduce((acc, r) => {
      const k = normalize(r.kategori) || "Lainnya"
      acc[k] = (acc[k]||0) + 1
      return acc
    }, {} as Record<string,number>)
  ).sort((a,b) => b[1]-a[1]).slice(0,8)

  // By Type
  const typeStats = Object.entries(
    filtered.reduce((acc, r) => {
      const t = r.type?.toUpperCase().trim() || "-"
      acc[t] = (acc[t]||0) + 1
      return acc
    }, {} as Record<string,number>)
  ).sort((a,b) => b[1]-a[1])

  // Table pagination
  const searched = filtered.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.kode_ap.toLowerCase().includes(q) || r.deskripsi.toLowerCase().includes(q) || r.pic_setting.toLowerCase().includes(q)
  })
  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE))
  const paginated  = searched.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const allPics = MDM_TEAM.filter(p => data.some(r => r.pic_setting === p))
  const allKat  = [...new Set(data.map(r => normalize(r.kategori)).filter(Boolean))].sort()
  const allType = [...new Set(data.map(r => r.type?.toUpperCase().trim()).filter(Boolean))].sort()

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Memuat data Monitoring Setting...</p>
    </div>
  )
  if (error) return <div className="flex items-center justify-center h-40"><p className="text-red-500 text-sm">⚠️ {error}</p></div>
  if (!data.length) return (
    <div className="flex flex-col items-center justify-center h-40 text-center">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-gray-400 text-sm">Belum ada data. Superadmin perlu upload file MDM terlebih dahulu.</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border p-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filter</span>

        <select value={filterPic} onChange={e => { setFilterPic(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
          <option value="ALL">Semua PIC</option>
          {allPics.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
          <option value="ALL">Semua Status</option>
          <option value="OK">✅ OK</option>
          <option value="BATAL">❌ Batal/Cancel</option>
          <option value="REV">⚠️ Revisi</option>
        </select>

        <select value={filterKat} onChange={e => { setFilterKat(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
          <option value="ALL">Semua Kategori</option>
          {allKat.map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400">
          <option value="ALL">Semua Type</option>
          {allType.map(t => <option key={t} value={t.replace(/ /g,"_")}>{t}</option>)}
        </select>

        <input type="text" placeholder="Cari kode AP, deskripsi, PIC..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border rounded-xl px-3 py-1.5 text-xs w-60 focus:outline-none focus:border-blue-400 ml-auto" />

        <div className="text-xs text-gray-400">{filtered.length.toLocaleString()} dokumen</div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Dokumen",  value: total.toLocaleString(),       sub: "semua status",           color: "text-gray-800",    icon: "📋" },
          { label: "Selesai (OK)",   value: totalOK.toLocaleString(),     sub: `${total ? ((totalOK/total)*100).toFixed(1) : 0}% dari total`, color: "text-emerald-600", icon: "✅" },
          { label: "Batal/Cancel",   value: totalBatal.toLocaleString(),  sub: `${total ? ((totalBatal/total)*100).toFixed(1) : 0}% dari total`, color: "text-red-500",     icon: "❌" },
          { label: "Total Setting",  value: totalJml.toLocaleString(),    sub: "jml setting",            color: "text-blue-600",    icon: "🔢" },
          { label: "Total Bobot",    value: totalBobot.toLocaleString(),  sub: "akumulasi bobot",        color: "text-violet-600",  icon: "⚖️" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">{c.label}</p>
              <span className="text-lg">{c.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* SUB NAV */}
      <div className="flex gap-2">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "bypic",    label: "👤 By PIC" },
          { key: "table",    label: "📋 Semua Dokumen" },
        ].map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key as typeof activeSection)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeSection === s.key ? "bg-blue-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-2 gap-4">

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Distribusi Status Setting</h3>
            <div className="space-y-3">
              {[
                { label: "OK / Selesai", count: totalOK,   color: "#10b981", pct: total ? (totalOK/total)*100 : 0 },
                { label: "Revisi",       count: totalRev,  color: "#f59e0b", pct: total ? (totalRev/total)*100 : 0 },
                { label: "Batal/Cancel", count: totalBatal,color: "#ef4444", pct: total ? (totalBatal/total)*100 : 0 },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-gray-600 font-medium">{s.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="h-6 rounded-full flex items-center pl-3 text-white text-xs font-bold transition-all"
                      style={{ width: `${Math.max(s.pct, 3)}%`, backgroundColor: s.color }}>
                      {s.count > 0 ? s.count.toLocaleString() : ""}
                    </div>
                  </div>
                  <div className="w-12 text-xs text-right text-gray-500">{s.pct.toFixed(1)}%</div>
                </div>
              ))}
            </div>
            {/* Stacked visual */}
            <div className="mt-5 w-full h-4 rounded-full overflow-hidden flex">
              <div className="bg-emerald-400 h-4" style={{ width: `${total ? (totalOK/total)*100 : 0}%` }} title={`OK: ${totalOK}`} />
              <div className="bg-amber-400 h-4"   style={{ width: `${total ? (totalRev/total)*100 : 0}%` }} title={`Rev: ${totalRev}`} />
              <div className="bg-red-400 h-4"     style={{ width: `${total ? (totalBatal/total)*100 : 0}%` }} title={`Batal: ${totalBatal}`} />
            </div>
          </div>

          {/* Kategori Breakdown */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Kategori Setting</h3>
            <div className="space-y-2">
              {katStats.map(([kat, cnt]) => (
                <div key={kat} className="flex items-center gap-3">
                  <KategoriBadge kategori={kat} />
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-4 rounded-full bg-blue-400"
                      style={{ width: `${(cnt / katStats[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right font-medium">{cnt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Type Setting</h3>
            <div className="grid grid-cols-2 gap-3">
              {typeStats.map(([type, cnt]) => {
                const pct = total ? (cnt/total)*100 : 0
                const isNew = type.includes("NEW")
                const isNasional = type.includes("NASIONAL")
                const color = isNew && isNasional ? "#8b5cf6" : isNew ? "#3b82f6" : isNasional ? "#f59e0b" : "#6b7280"
                return (
                  <div key={type} className="border rounded-xl p-3 text-center">
                    <p className="text-xl font-bold" style={{ color }}>{cnt.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.replace(/_/g," ")}</p>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}%</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Controller & Release Status */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">Status Controller & Release</h3>
            {[
              { label: "Controller",
                stats: Object.entries(filtered.reduce((acc,r) => { const k = r.status_controller?.toUpperCase()||"-"; acc[k]=(acc[k]||0)+1; return acc },{}as Record<string,number>)).sort((a,b)=>b[1]-a[1]) },
              { label: "Release",
                stats: Object.entries(filtered.reduce((acc,r) => { const k = r.status_release?.toUpperCase()||"-"; acc[k]=(acc[k]||0)+1; return acc },{}as Record<string,number>)).sort((a,b)=>b[1]-a[1]) },
            ].map(section => (
              <div key={section.label} className="mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">{section.label}</p>
                <div className="flex gap-2 flex-wrap">
                  {section.stats.map(([st, cnt]) => st !== "-" && (
                    <div key={st} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border rounded-xl">
                      <StatusBadge status={st} />
                      <span className="text-xs font-bold text-gray-600">{cnt.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BY PIC */}
      {activeSection === "bypic" && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold mb-4">Performa per PIC Setting</h3>
          <div className="space-y-4">
            {picStats.map((p, i) => (
              <div key={p.pic} className="border rounded-xl p-4 hover:bg-blue-50 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-orange-400 text-white" : "bg-blue-100 text-blue-600"
                    }`}>
                      {i < 3 ? ["🥇","🥈","🥉"][i] : p.pic.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{p.pic}</p>
                      <p className="text-xs text-gray-400">{p.total.toLocaleString()} dokumen · {p.jml.toLocaleString()} setting · bobot {p.bobot.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{p.ok.toLocaleString()} OK</p>
                    <p className="text-xs text-gray-400">{p.total > 0 ? ((p.ok/p.total)*100).toFixed(1) : 0}% selesai</p>
                  </div>
                </div>

                {/* Stacked bar */}
                <div className="w-full h-4 rounded-full overflow-hidden flex mb-2">
                  <div className="bg-emerald-400 h-4" style={{ width: `${p.total ? (p.ok/p.total)*100 : 0}%` }} title={`OK: ${p.ok}`} />
                  <div className="bg-amber-400  h-4" style={{ width: `${p.total ? (p.rev/p.total)*100 : 0}%` }} title={`Rev: ${p.rev}`} />
                  <div className="bg-red-400    h-4" style={{ width: `${p.total ? (p.batal/p.total)*100 : 0}%` }} title={`Batal: ${p.batal}`} />
                  <div className="bg-gray-200   h-4 flex-1" />
                </div>

                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="text-emerald-600">✅ {p.ok} OK</span>
                  {p.rev > 0 && <span className="text-amber-600">⚠️ {p.rev} Revisi</span>}
                  {p.batal > 0 && <span className="text-red-500">❌ {p.batal} Batal</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLE */}
      {activeSection === "table" && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Daftar Dokumen Monitoring Setting</h3>
              <p className="text-xs text-gray-400 mt-0.5">{searched.length.toLocaleString()} dokumen</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
                  <th className="px-3 py-3 text-left w-8">#</th>
                  <th className="px-3 py-3 text-left">Kode AP</th>
                  <th className="px-3 py-3 text-left">Deskripsi</th>
                  <th className="px-3 py-3 text-center">PIC</th>
                  <th className="px-3 py-3 text-center">Kategori</th>
                  <th className="px-3 py-3 text-center">Type</th>
                  <th className="px-3 py-3 text-center">Jml</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Controller</th>
                  <th className="px-3 py-3 text-center">Release</th>
                  <th className="px-3 py-3 text-left">Tgl Setting</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.id || i} className={`border-t ${i%2===0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                    <td className="px-3 py-2 text-xs text-gray-400">{(page-1)*PAGE_SIZE+i+1}</td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-600 whitespace-nowrap">{r.kode_ap}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 max-w-[240px] truncate" title={r.deskripsi}>{r.deskripsi}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{r.pic_setting}</span>
                    </td>
                    <td className="px-3 py-2 text-center"><KategoriBadge kategori={r.kategori} /></td>
                    <td className="px-3 py-2 text-center text-xs text-gray-500">{r.type}</td>
                    <td className="px-3 py-2 text-center text-xs font-bold text-gray-700">{r.jml_setting}</td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={r.status_controller} /></td>
                    <td className="px-3 py-2 text-center">{r.status_release ? <StatusBadge status={r.status_release} /> : <span className="text-xs text-gray-300">-</span>}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.tgl_setting || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-1">
                <button disabled={page===1} onClick={() => setPage(1)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">«</button>
                <button disabled={page===1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">‹</button>
                {Array.from({length: Math.min(5, totalPages)}, (_, idx) => {
                  let p = idx+1
                  if (totalPages > 5 && page > 3) p = page-2+idx
                  if (p > totalPages) return null
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg border text-xs ${p===page ? "bg-blue-500 text-white border-blue-500" : "hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  )
                })}
                <button disabled={page===totalPages} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">›</button>
                <button disabled={page===totalPages} onClick={() => setPage(totalPages)} className="px-2 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
