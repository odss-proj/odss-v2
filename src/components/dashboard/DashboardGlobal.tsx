"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import OwnCloudView from "../kpi/OwnCloudView"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, LineChart, Line,
  CartesianGrid, RadialBarChart, RadialBar
} from "recharts"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MainTab = "home" | "phi" | "indo" | "owncloud"
type PhiTab  = "backlog" | "backup" | "restore"
type IndoTab = "area_cover" | "monitoring"

interface BacklogRow {
  no: number; concern: string; app: string; type: string
  status: string; remark: string; concern_pic: string; note: string
  priority: number
}
interface BackupRow {
  adp_code: number; aor: string; server: number; adp_name: string
  support: string; db_schema: string; db_utama: string
  total_backup_done: number; backup_completion_pct: number
  latest_week_backup: string
}
interface RestoreRow {
  no: number; area: string; adp_code: number; adp_name: string
  restore_date: string; restore_status: string
  backup_size: string; pic_phi: string; pic_restore: string
}
interface VmRow {
  vm: string; drive: string; total_gb: number; free_gb: number
  used_gb: number; used_pct: number; update_date: string
  w1: number; w2: number; w3: number; w4: number
  w5: number; w6: number; w7: number; w8: number
  w9: number; w10: number; w11: number; w12: number
  w13: number; w14: number; w15: number; w16: number
}
interface AreaRow {
  status: string; kode_subdist: number; nama_subdist: string
  cover: string; pic: string; vm: string; schema_name: string
  size_datafile_gb: number; region: string; rom: string
  divisi: string; bom_aos_aom: string; cabang: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const AREA_COLORS: Record<string, string> = {
  GMA: "#6366f1", NOL: "#3b82f6", SOL: "#10b981",
  VIS: "#f59e0b", MIN: "#ef4444",
}
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "DONE":        { bg: "bg-emerald-100", text: "text-emerald-700" },
  "PILOT":       { bg: "bg-blue-100",    text: "text-blue-700" },
  "REVIEW BR":   { bg: "bg-violet-100",  text: "text-violet-700" },
  "OPEN DR":     { bg: "bg-orange-100",  text: "text-orange-700" },
  "OPEN DEV":    { bg: "bg-yellow-100",  text: "text-yellow-700" },
  "OPG Test":    { bg: "bg-cyan-100",    text: "text-cyan-700" },
  "OPG Dev":     { bg: "bg-yellow-100",  text: "text-yellow-700" },
  "ON PROGRESS": { bg: "bg-blue-100",    text: "text-blue-700" },
  "OPEN":        { bg: "bg-gray-100",    text: "text-gray-600" },
  "HOLD":        { bg: "bg-red-100",     text: "text-red-600" },
  "OPEN PI":     { bg: "bg-pink-100",    text: "text-pink-700" },
  "OPEN FS":     { bg: "bg-indigo-100",  text: "text-indigo-700" },
}
const TYPE_COLOR: Record<string, string> = {
  Request: "#3b82f6", Issue: "#ef4444", Discussion: "#f59e0b",
  Concern: "#8b5cf6", Decision: "#10b981",
}
const CHART_COLORS = ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"]

const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0
const fmt  = (n: number | undefined) => (n ?? 0).toLocaleString("id-ID")

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: string; color: string
}) {
  return (
    <div className={`rounded-2xl p-5 flex items-center justify-between ${color}`}>
      <div>
        <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
      </div>
      <span className="text-4xl opacity-80">{icon}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || { bg: "bg-gray-100", text: "text-gray-500" }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.bg} ${s.text}`}>
      {status || "—"}
    </span>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function DashboardGlobal() {
  const [mainTab, setMainTab] = useState<MainTab>("home")
  const [phiTab,  setPhiTab]  = useState<PhiTab>("backlog")
  const [indoTab, setIndoTab] = useState<IndoTab>("area_cover")
  const [loading, setLoading] = useState(true)

  const [backlog,  setBacklog]  = useState<BacklogRow[]>([])
  const [backup,   setBackup]   = useState<BackupRow[]>([])
  const [restore,  setRestore]  = useState<RestoreRow[]>([])
  const [area,     setArea]     = useState<AreaRow[]>([])
  const [vmData,   setVmData]   = useState<VmRow[]>([])
  const [search,   setSearch]   = useState("")
  const [page,     setPage]     = useState(1)
  const PAGE = 15

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [bl, bk, rs, ar, vm] = await Promise.all([
        supabase.from("global_backlog").select("*").limit(200),
        supabase.from("global_backup").select("*").limit(200),
        supabase.from("global_restore").select("*").limit(200),
        supabase.from("area_cover_cns").select("*").limit(500),
        supabase.from("global_vm_monitoring").select("*").limit(500),
      ])
      if (bl.data) setBacklog(bl.data as BacklogRow[])
      if (bk.data) setBackup(bk.data as BackupRow[])
      if (rs.data) setRestore(rs.data as RestoreRow[])
      if (ar.data) setArea(ar.data as AreaRow[])
      if (vm.data) setVmData(vm.data as VmRow[])
      setLoading(false)
    }
    load()
  }, [])

  // ── Derived Stats ──────────────────────────────────────────
  // Backlog
  const blDone     = backlog.filter(r => r.status === "DONE").length
  const blOpen     = backlog.filter(r => ["OPEN","OPEN DR","OPEN DEV","OPEN PI","OPEN FS"].includes(r.status)).length
  const blProgress = backlog.filter(r => ["REVIEW BR","PILOT","OPG Test","OPG Dev","ON PROGRESS"].includes(r.status)).length
  const blStatusChart = Object.entries(backlog.reduce((a, r) => {
    a[r.status || "Unknown"] = (a[r.status || "Unknown"] || 0) + 1; return a
  }, {} as Record<string,number>)).sort((a,b) => b[1]-a[1]).map(([name,value]) => ({ name, value }))
  const blTypeChart = Object.entries(backlog.reduce((a, r) => {
    a[r.type || "Unknown"] = (a[r.type || "Unknown"] || 0) + 1; return a
  }, {} as Record<string,number>)).map(([name,value]) => ({ name, value }))
  const blAppChart = Object.entries(backlog.reduce((a, r) => {
    const app = (r.app || "").split(",")[0].trim() || "Unknown"
    a[app] = (a[app] || 0) + 1; return a
  }, {} as Record<string,number>)).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([name,value]) => ({ name, value }))

  // Backup
  const bkTotal  = backup.length
  const bkAvgPct = backup.length > 0
    ? Math.round(backup.reduce((a, r) => a + (Number(r.backup_completion_pct) || 0), 0) / backup.length)
    : 0
  const bkByAOR = Object.entries(backup.reduce((a, r) => {
    a[r.aor] = (a[r.aor] || 0) + 1; return a
  }, {} as Record<string,number>)).map(([name,value]) => ({ name, value }))
  const bkByPIC = Object.entries(backup.reduce((a, r) => {
    a[r.support] = (a[r.support] || 0) + 1; return a
  }, {} as Record<string,number>)).map(([name,value]) => ({ name, value }))
  const bkCompletionDist = [
    { name: "100%",  value: backup.filter(r => Number(r.backup_completion_pct) >= 100).length },
    { name: "50-99%", value: backup.filter(r => Number(r.backup_completion_pct) >= 50 && Number(r.backup_completion_pct) < 100).length },
    { name: "<50%",  value: backup.filter(r => Number(r.backup_completion_pct) < 50).length },
  ]

  // Restore
  const rsSuccess = restore.filter(r => r.restore_status === "Success").length
  const rsPending = restore.length - rsSuccess
  const rsByArea  = Object.entries(restore.reduce((a, r) => {
    if (!a[r.area]) a[r.area] = { total: 0, success: 0 }
    a[r.area].total++
    if (r.restore_status === "Success") a[r.area].success++
    return a
  }, {} as Record<string,{total:number;success:number}>))
  .map(([area, v]) => ({ area, ...v, rate: pct(v.success, v.total) }))
  .sort((a,b) => b.total - a.total)

  // Area Cover
  const arTotal    = area.length
  const arTotalGB  = area.reduce((a, r) => a + (Number(r.size_datafile_gb) || 0), 0)
  const arByVM     = Object.entries(area.reduce((a, r) => {
    const vm = r.vm || "Unknown"
    if (!a[vm]) a[vm] = { count: 0, gb: 0 }
    a[vm].count++; a[vm].gb += Number(r.size_datafile_gb) || 0
    return a
  }, {} as Record<string,{count:number;gb:number}>))
  .map(([vm, v]) => ({ vm, count: v.count, gb: Math.round(v.gb * 10) / 10 }))
  .sort((a,b) => b.count - a.count).slice(0, 12)

  const arByRegion = Object.entries(area.reduce((a, r) => {
    const reg = r.region || "Unknown"
    if (!a[reg]) a[reg] = { count: 0, gb: 0 }
    a[reg].count++; a[reg].gb += Number(r.size_datafile_gb) || 0
    return a
  }, {} as Record<string,{count:number;gb:number}>))
  .map(([region, v]) => ({ region, count: v.count, gb: Math.round(v.gb) }))
  .sort((a,b) => b.gb - a.gb).slice(0, 8)

  const arByDivisi = Object.entries(area.reduce((a, r) => {
    a[r.divisi || "Unknown"] = (a[r.divisi || "Unknown"] || 0) + 1; return a
  }, {} as Record<string,number>)).map(([name,value]) => ({ name, value }))
  .sort((a,b) => b.value - a.value)

  // Table
  const filtered = area.filter(r =>
    !search || r.nama_subdist?.toLowerCase().includes(search.toLowerCase()) ||
    r.vm?.toLowerCase().includes(search.toLowerCase()) ||
    r.region?.toLowerCase().includes(search.toLowerCase()) ||
    r.pic?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const pageData   = filtered.slice((page-1)*PAGE, page*PAGE)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100"/>
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"/>
      </div>
      <p className="text-sm text-gray-400 font-medium">Memuat data Global...</p>
    </div>
  )

  return (
    <div className="space-y-5 pb-8">

      {/* ── HERO BANNER ────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 50%)"
        }}/>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌏</span>
              <span className="text-xs font-semibold uppercase tracking-widest opacity-60">Global Operations</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Global Dashboard</h1>
            <p className="text-sm opacity-60 mt-1">Monitoring PHI (Philippines) & Indonesia Operations</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-3xl font-black">{backup.length}</p>
              <p className="text-xs opacity-50 mt-0.5">ADP PHI</p>
            </div>
            <div className="w-px bg-white/10"/>
            <div>
              <p className="text-3xl font-black">{rsSuccess}</p>
              <p className="text-xs opacity-50 mt-0.5">Restored</p>
            </div>
            <div className="w-px bg-white/10"/>
            <div>
              <p className="text-3xl font-black">{arTotal}</p>
              <p className="text-xs opacity-50 mt-0.5">CNS Indo</p>
            </div>
            <div className="w-px bg-white/10"/>
            <div>
              <p className="text-3xl font-black">{Math.round(arTotalGB)}</p>
              <p className="text-xs opacity-50 mt-0.5">Total GB</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN TABS ──────────────────────────────────── */}
      <div className="flex gap-2">
        {([
          { key: "home",     label: "🏠 Home",        desc: "Overview" },
          { key: "phi",      label: "🇵🇭 PHI",         desc: "Philippines" },
          { key: "indo",     label: "🇮🇩 Indonesia",    desc: "Lokal" },
          { key: "owncloud", label: "☁️ Own Cloud",    desc: "Achievement" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => { setMainTab(t.key); setPage(1) }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
              mainTab === t.key
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
            }`}>
            {t.label}
            <span className={`ml-2 text-xs font-normal ${mainTab === t.key ? "opacity-70" : "text-gray-400"}`}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          HOME TAB
      ══════════════════════════════════════════════ */}
      {mainTab === "home" && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total ADP PHI"      value={bkTotal}           sub="Philippines"         icon="🇵🇭" color="bg-gradient-to-br from-indigo-500 to-purple-600 text-white" />
            <StatCard label="Backup Completion"  value={`${bkAvgPct}%`}    sub={`${bkByAOR.length} area`} icon="💾" color="bg-gradient-to-br from-blue-500 to-cyan-500 text-white" />
            <StatCard label="Restore Success"    value={rsSuccess}          sub={`${rsPending} pending`}   icon="✅" color="bg-gradient-to-br from-emerald-500 to-teal-500 text-white" />
            <StatCard label="Total CNS Indo"     value={arTotal}            sub={`${Math.round(arTotalGB)} GB total`} icon="🗺️" color="bg-gradient-to-br from-amber-500 to-orange-500 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* PHI: Backup per Area */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-1">PHI — Backup per Area</h3>
              <p className="text-xs text-gray-400 mb-4">{bkTotal} ADP terdaftar</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bkByAOR}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                  <YAxis/>
                  <Tooltip/>
                  <Bar dataKey="value" radius={[8,8,0,0]}>
                    {bkByAOR.map((_, i) => <Cell key={i} fill={Object.values(AREA_COLORS)[i % 5]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* INDO: DB Size per Region */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-1">Indo — DB Size per Region (GB)</h3>
              <p className="text-xs text-gray-400 mb-4">Top 8 region berdasarkan total size</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={arByRegion} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }}/>
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={120}/>
                  <Tooltip formatter={(v: unknown) => [`${v} GB`, "Total Size"]}/>
                  <Bar dataKey="gb" radius={[0,6,6,0]} fill="#6366f1"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PHI Restore + INDO Divisi */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-1">PHI — Restore Status per Area</h3>
              <p className="text-xs text-gray-400 mb-4">{rsSuccess} berhasil dari {restore.length} ADP</p>
              <div className="space-y-3">
                {rsByArea.map((r) => (
                  <div key={r.area} className="flex items-center gap-3">
                    <div className="w-12 text-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: AREA_COLORS[r.area] || "#6b7280" }}>
                        {r.area}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div className="h-6 rounded-full flex items-center px-2 transition-all"
                        style={{ width: `${Math.max(pct(r.success, r.total), 5)}%`, backgroundColor: AREA_COLORS[r.area] || "#6b7280" }}>
                        <span className="text-white text-xs font-bold">{r.success}</span>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-xs font-bold text-gray-600">{r.rate}%</span>
                      <p className="text-xs text-gray-400">{r.total} ADP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-1">Indo — Distribusi Divisi CNS</h3>
              <p className="text-xs text-gray-400 mb-4">{arTotal} CNS aktif</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={arByDivisi} dataKey="value" nameKey="name" cx="40%" cy="50%"
                    outerRadius={80} label={false}>
                    {arByDivisi.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle"
                    formatter={(v: string) => <span className="text-xs text-gray-600">{v}</span>}/>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Backlog summary */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800">PHI — Backlog Status Overview</h3>
                <p className="text-xs text-gray-400 mt-0.5">{backlog.length} concern & request</p>
              </div>
              <div className="flex gap-3 text-center">
                {[
                  { label: "Done",     val: blDone,     color: "text-emerald-600" },
                  { label: "Progress", val: blProgress, color: "text-blue-600" },
                  { label: "Open",     val: blOpen,     color: "text-orange-600" },
                ].map(s => (
                  <div key={s.label} className="px-4 py-2 bg-gray-50 rounded-xl">
                    <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Stacked bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex gap-0.5">
              {[
                { count: blDone,     color: "#10b981" },
                { count: blProgress, color: "#3b82f6" },
                { count: blOpen,     color: "#f59e0b" },
              ].map((s, i) => (
                <div key={i} className="h-4 rounded-full transition-all"
                  style={{ width: `${pct(s.count, backlog.length)}%`, backgroundColor: s.color }}/>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500 justify-center">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>Done ({pct(blDone, backlog.length)}%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/>Progress ({pct(blProgress, backlog.length)}%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/>Open ({pct(blOpen, backlog.length)}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PHI TAB
      ══════════════════════════════════════════════ */}
      {mainTab === "phi" && (
        <div className="space-y-5">
          {/* PHI Sub-tabs */}
          <div className="flex gap-2 bg-white border rounded-2xl p-2 w-fit">
            {([
              { key: "backlog", label: "📋 Backlog",  },
              { key: "backup",  label: "💾 Backup",   },
              { key: "restore", label: "🔄 Restore",  },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setPhiTab(t.key)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  phiTab === t.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── BACKLOG ── */}
          {phiTab === "backlog" && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total Concern"  value={backlog.length}  sub="Semua status"     icon="📋" color="bg-indigo-50 text-indigo-900"/>
                <StatCard label="Done"           value={blDone}          sub={`${pct(blDone,backlog.length)}% selesai`}  icon="✅" color="bg-emerald-50 text-emerald-900"/>
                <StatCard label="On Progress"    value={blProgress}      sub="Review, Pilot, dll" icon="🔄" color="bg-blue-50 text-blue-900"/>
                <StatCard label="Open"           value={blOpen}          sub="Belum dimulai"    icon="⏳" color="bg-amber-50 text-amber-900"/>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Status chart */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Status Breakdown</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={blStatusChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50}/>
                      <YAxis/>
                      <Tooltip/>
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {blStatusChart.map((entry, i) => {
                          const s = STATUS_STYLE[entry.name]
                          const clr = s ? s.bg.replace("bg-","").replace("-100","") : "gray-300"
                          return <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Type + App charts */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Request by Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {blTypeChart.map((t, i) => (
                        <div key={t.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
                          style={{ borderColor: TYPE_COLOR[t.name] || "#d1d5db" }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[t.name] || "#9ca3af" }}/>
                          <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                          <span className="text-xs text-gray-400">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border p-5">
                    <h3 className="font-bold text-gray-800 mb-3">Top Aplikasi</h3>
                    <div className="space-y-2">
                      {blAppChart.map((a, i) => (
                        <div key={a.name} className="flex items-center gap-2">
                          <div className="w-24 text-xs text-gray-500 truncate">{a.name}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div className="h-4 rounded-full" style={{ width: `${pct(a.value, blAppChart[0].value) || 5}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}/>
                          </div>
                          <div className="w-6 text-xs text-gray-500 text-right">{a.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Backlog table */}
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-bold text-gray-800 mb-4">Daftar Backlog PHI ({backlog.length})</h3>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        {["#","Concern","App","Type","Status","PIC","Note"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {backlog.map((r, i) => (
                        <tr key={i} className={`border-t ${i%2===0?"bg-white":"bg-gray-50/50"} hover:bg-indigo-50/50`}>
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{r.no || i+1}</td>
                          <td className="px-3 py-2.5 text-gray-800 text-xs font-medium max-w-[200px]">
                            <p className="truncate">{r.concern || "—"}</p>
                            {r.remark && <p className="text-gray-400 text-xs truncate">{r.remark.substring(0,60)}...</p>}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.app || "—"}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${TYPE_COLOR[r.type]}22`, color: TYPE_COLOR[r.type] || "#6b7280" }}>
                              {r.type || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5"><StatusBadge status={r.status}/></td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.concern_pic || "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-400 max-w-[160px] truncate">{r.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── BACKUP ── */}
          {phiTab === "backup" && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total ADP"      value={bkTotal}        sub="Philippines"           icon="🏢" color="bg-indigo-50 text-indigo-900"/>
                <StatCard label="Avg Completion" value={`${bkAvgPct}%`} sub="Rata-rata backup"      icon="📊" color="bg-blue-50 text-blue-900"/>
                <StatCard label="Full 100%"      value={bkCompletionDist[0].value} sub="Semua week selesai" icon="💯" color="bg-emerald-50 text-emerald-900"/>
                <StatCard label="Kurang 50%"     value={bkCompletionDist[2].value} sub="Perlu perhatian"    icon="⚠️" color="bg-red-50 text-red-900"/>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {/* Pie completion */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-3">Completion Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={bkCompletionDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                        label={false}>
                        {bkCompletionDist.map((_, i) => <Cell key={i} fill={["#10b981","#f59e0b","#ef4444"][i]}/>)}
                      </Pie>
                      <Legend formatter={(v: string) => <span className="text-xs">{v}</span>}/>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* By area */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-3">ADP per Area</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={bkByAOR}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                      <YAxis/>
                      <Tooltip/>
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {bkByAOR.map((entry, i) => <Cell key={i} fill={AREA_COLORS[entry.name] || "#6b7280"}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* By PIC */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-3">ADP per PIC Support</h3>
                  <div className="space-y-3 mt-2">
                    {bkByPIC.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <div className="w-14 text-xs font-bold text-gray-700">{p.name}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                          <div className="h-7 rounded-full flex items-center px-2"
                            style={{ width: `${pct(p.value, bkTotal)}%`, backgroundColor: CHART_COLORS[i] }}>
                            <span className="text-white text-xs font-bold">{p.value}</span>
                          </div>
                        </div>
                        <div className="w-10 text-xs text-gray-400 text-right">{pct(p.value,bkTotal)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Backup table */}
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-bold text-gray-800 mb-4">Detail Backup per ADP</h3>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                        {["ADP Code","ADP Name","Area","Server","PIC","DB Schema","Week Done","Completion","Latest Week"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {backup.map((r, i) => (
                        <tr key={i} className={`border-t ${i%2===0?"bg-white":"bg-gray-50/50"} hover:bg-blue-50/50`}>
                          <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.adp_code}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800 max-w-[180px] truncate">{r.adp_name}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full text-white text-xs font-bold"
                              style={{ backgroundColor: AREA_COLORS[r.aor] || "#6b7280" }}>
                              {r.aor}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 text-center">{r.server}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.support}</td>
                          <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.db_schema}</td>
                          <td className="px-3 py-2.5 text-xs text-center font-bold text-gray-700">{r.total_backup_done}/52</td>
                          <td className="px-3 py-2.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full"
                                  style={{ width: `${r.backup_completion_pct || 0}%`,
                                    backgroundColor: Number(r.backup_completion_pct) >= 80 ? "#10b981" : Number(r.backup_completion_pct) >= 50 ? "#f59e0b" : "#ef4444" }}/>
                              </div>
                              <span className={`text-xs font-bold ${Number(r.backup_completion_pct)>=80?"text-emerald-600":Number(r.backup_completion_pct)>=50?"text-amber-600":"text-red-600"}`}>
                                {r.backup_completion_pct || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500">{r.latest_week_backup || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── RESTORE ── */}
          {phiTab === "restore" && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total ADP"    value={restore.length} sub="Semua area"      icon="🔄" color="bg-indigo-50 text-indigo-900"/>
                <StatCard label="Success"      value={rsSuccess}      sub={`${pct(rsSuccess,restore.length)}% berhasil`} icon="✅" color="bg-emerald-50 text-emerald-900"/>
                <StatCard label="Pending"      value={rsPending}      sub="Belum restore"   icon="⏳" color="bg-amber-50 text-amber-900"/>
                <StatCard label="Success Rate" value={`${pct(rsSuccess,restore.length)}%`} sub="Overall" icon="📊" color="bg-blue-50 text-blue-900"/>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Restore by area stacked */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Success vs Pending per Area</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={rsByArea}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
                      <XAxis dataKey="area" tick={{ fontSize: 12 }}/>
                      <YAxis/>
                      <Tooltip/>
                      <Legend/>
                      <Bar dataKey="success" name="Success" stackId="a" fill="#10b981" radius={[0,0,0,0]}/>
                      <Bar dataKey="total" name="Total" stackId="b" fill="#e5e7eb" radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Rate per area */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Success Rate per Area</h3>
                  <div className="space-y-4">
                    {rsByArea.map(r => (
                      <div key={r.area} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: AREA_COLORS[r.area] || "#6b7280" }}>
                              {r.area}
                            </span>
                            <span className="text-xs text-gray-500">{r.success}/{r.total} ADP</span>
                          </div>
                          <span className={`text-sm font-black ${r.rate >= 50 ? "text-emerald-600" : "text-red-500"}`}>
                            {r.rate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className="h-3 rounded-full transition-all"
                            style={{ width: `${r.rate}%`, backgroundColor: AREA_COLORS[r.area] || "#6b7280" }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Restore table */}
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-bold text-gray-800 mb-4">Detail Restore per ADP</h3>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                        {["#","Area","ADP Code","ADP Name","Restore Date","Backup Size","Status","PIC Restore","PIC PHI"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {restore.map((r, i) => (
                        <tr key={i} className={`border-t ${i%2===0?"bg-white":"bg-gray-50/50"} hover:bg-emerald-50/50`}>
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{r.no || i+1}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full text-white text-xs font-bold"
                              style={{ backgroundColor: AREA_COLORS[r.area] || "#6b7280" }}>
                              {r.area || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.adp_code}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800 max-w-[180px] truncate">{r.adp_name}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.restore_date || "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.backup_size || "—"}</td>
                          <td className="px-3 py-2.5">
                            {r.restore_status === "Success"
                              ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✅ Success</span>
                              : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">⏳ Pending</span>
                            }
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.pic_restore || "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.pic_phi || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          INDO TAB
      ══════════════════════════════════════════════ */}
      {mainTab === "indo" && (
        <div className="space-y-5">
          {/* Indo sub-tabs */}
          <div className="flex gap-2 bg-white border rounded-2xl p-2 w-fit">
            {([
              { key: "area_cover", label: "🗺️ Area Cover CNS" },
              { key: "monitoring", label: "📊 DB Size per VM"  },
            ] as const).map(t => (
              <button key={t.key} onClick={() => { setIndoTab(t.key); setPage(1) }}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  indoTab === t.key
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── AREA COVER ── */}
          {indoTab === "area_cover" && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total CNS Aktif" value={arTotal}             sub="Subdistributor"   icon="🏢" color="bg-amber-50 text-amber-900"/>
                <StatCard label="Total VM"         value={new Set(area.map(r=>r.vm)).size} sub="Virtual machines" icon="🖥️" color="bg-orange-50 text-orange-900"/>
                <StatCard label="Total Size DB"    value={`${Math.round(arTotalGB)} GB`} sub="Semua CNS"    icon="💿" color="bg-red-50 text-red-900"/>
                <StatCard label="Avg Size per CNS" value={`${(arTotalGB/arTotal).toFixed(1)} GB`} sub="Rata-rata"   icon="📐" color="bg-pink-50 text-pink-900"/>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* VM count */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-1">Jumlah CNS per VM</h3>
                  <p className="text-xs text-gray-400 mb-3">{arByVM.length} VM aktif</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={arByVM}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
                      <XAxis dataKey="vm" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={45}/>
                      <YAxis/>
                      <Tooltip/>
                      <Bar dataKey="count" name="CNS" radius={[6,6,0,0]} fill="#f59e0b"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Region size */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-1">Total DB Size per Region (GB)</h3>
                  <p className="text-xs text-gray-400 mb-3">Top 8 region</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={arByRegion} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }}/>
                      <YAxis type="category" dataKey="region" tick={{ fontSize: 9 }} width={115}/>
                      <Tooltip formatter={(v: unknown) => [`${v} GB`, "Total"]}/>
                      <Bar dataKey="gb" radius={[0,6,6,0]} fill="#f97316"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Searchable table */}
              <div className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">Daftar CNS Aktif ({filtered.length})</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Area Cover + BOM ROM NOM + CNS Aktif</p>
                  </div>
                  <input type="text" placeholder="Cari nama, VM, region, PIC..."
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                    className="border rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:border-amber-400"/>
                </div>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        {["Kode","Nama Subdist","PIC","VM","Schema","Divisi","Region","ROM","Size (GB)","BOM/AOS"].map(h => (
                          <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((r, i) => (
                        <tr key={i} className={`border-t ${i%2===0?"bg-white":"bg-amber-50/30"} hover:bg-amber-50`}>
                          <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.kode_subdist}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800 max-w-[180px] truncate">{r.nama_subdist}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.pic}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">{r.vm}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.schema_name}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{r.divisi}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[130px] truncate">{r.region}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[120px] truncate">{r.rom}</td>
                          <td className="px-3 py-2.5 text-xs text-center font-bold"
                            style={{ color: Number(r.size_datafile_gb)>30?"#ef4444":Number(r.size_datafile_gb)>20?"#f59e0b":"#10b981" }}>
                            {r.size_datafile_gb || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-xs">
                            {r.bom_aos_aom && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.bom_aos_aom==="BOM"?"bg-blue-100 text-blue-700":r.bom_aos_aom==="AOS"?"bg-purple-100 text-purple-700":"bg-gray-100 text-gray-600"}`}>{r.bom_aos_aom}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-gray-400">Hal. {page}/{totalPages} ({filtered.length} CNS)</p>
                    <div className="flex gap-1.5">
                      <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                        className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">←</button>
                      {Array.from({length:Math.min(5,totalPages)},(_,idx)=>{
                        let p=idx+1; if(totalPages>5&&page>3) p=page-2+idx
                        if(p>totalPages) return null
                        return <button key={p} onClick={()=>setPage(p)}
                          className={`px-3 py-1.5 rounded-lg border text-xs ${p===page?"bg-amber-500 text-white border-amber-500":"hover:bg-gray-50"}`}>{p}</button>
                      })}
                      <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}
                        className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50">→</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MONITORING DB ── */}
          {indoTab === "monitoring" && (() => {
            // Compute VM summary from real data
            const vmSummary = Object.entries(
              vmData.reduce((acc, r) => {
                if (!acc[r.vm]) acc[r.vm] = { total: 0, used: 0, free: 0 }
                acc[r.vm].total += Number(r.total_gb) || 0
                acc[r.vm].used  += Number(r.used_gb)  || 0
                acc[r.vm].free  += Number(r.free_gb)  || 0
                return acc
              }, {} as Record<string,{total:number;used:number;free:number}>)
            ).map(([vm, v]) => ({
              vm, total: Math.round(v.total), used: Math.round(v.used),
              free: Math.round(v.free),
              pct: v.total > 0 ? Math.round((v.used/v.total)*100) : 0
            })).filter(v => v.total > 0).sort((a,b) => a.vm.localeCompare(b.vm, undefined, {numeric:true}))

            const totalStorage = vmSummary.reduce((a,v) => a + v.total, 0)
            const totalUsed    = vmSummary.reduce((a,v) => a + v.used, 0)
            const avgPct       = vmSummary.length > 0 ? Math.round(totalUsed/totalStorage*100) : 0
            const critical     = vmSummary.filter(v => v.pct >= 90).length
            const warning      = vmSummary.filter(v => v.pct >= 75 && v.pct < 90).length

            // Trend data (last 8 weeks, all VMs combined - Drive C only)
            const driveC = vmData.filter(r => r.drive === "C")
            const trendData = ["w9","w10","w11","w12","w13","w14","w15","w16"].map((wk, i) => ({
              week: `W${i+9}`,
              used: Math.round(driveC.reduce((a, r) => a + (Number((r as any)[wk]) || 0), 0))
            }))

            return (
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Total VM"      value={vmSummary.length}      sub="Virtual machines"      icon="🖥️" color="bg-violet-50 text-violet-900"/>
                  <StatCard label="Total Storage" value={`${totalStorage} GB`}  sub="Kapasitas total"        icon="💿" color="bg-indigo-50 text-indigo-900"/>
                  <StatCard label="Used Storage"  value={`${totalUsed} GB`}     sub={`${avgPct}% digunakan`} icon="📈" color="bg-orange-50 text-orange-900"/>
                  <StatCard label="Critical VM"   value={critical}               sub={`${warning} warning`}  icon="🔴" color={critical > 0 ? "bg-red-50 text-red-900" : "bg-green-50 text-green-900"}/>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Used % per VM */}
                  <div className="bg-white rounded-2xl border p-5">
                    <h3 className="font-bold text-gray-800 mb-1">Storage Usage % per VM</h3>
                    <p className="text-xs text-gray-400 mb-4">Merah ≥90%, Kuning ≥75%</p>
                    <div className="space-y-2.5">
                      {vmSummary.map(v => (
                        <div key={v.vm} className="flex items-center gap-3">
                          <div className="w-10 text-xs font-black text-center" style={{ color: v.pct>=90?"#dc2626":v.pct>=75?"#d97706":"#059669" }}>
                            {v.vm}
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div className="h-5 rounded-full flex items-center px-2 transition-all"
                              style={{ width: `${Math.max(v.pct, 3)}%`, backgroundColor: v.pct>=90?"#dc2626":v.pct>=75?"#f59e0b":"#10b981" }}>
                              <span className="text-white text-xs font-bold">{v.pct}%</span>
                            </div>
                          </div>
                          <div className="w-20 text-right text-xs text-gray-500">{v.used}/{v.total} GB</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trend used Drive C */}
                  <div className="bg-white rounded-2xl border p-5">
                    <h3 className="font-bold text-gray-800 mb-1">Trend Used Storage (Drive C) — 8 Minggu Terakhir</h3>
                    <p className="text-xs text-gray-400 mb-4">Total akumulasi semua VM, Drive C</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="week" tick={{ fontSize: 11 }}/>
                        <YAxis tickFormatter={v => `${v}GB`}/>
                        <Tooltip formatter={(v: unknown) => [`${v} GB`, "Used"]}/>
                        <Line type="monotone" dataKey="used" stroke="#7c3aed" strokeWidth={3}
                          dot={{ fill:"#7c3aed", r:4 }} activeDot={{ r:6 }}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Detail table per VM per Drive */}
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Detail per VM & Drive (Update: 20/04/2026)</h3>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                          {["VM","Drive","Total (GB)","Free (GB)","Used (GB)","Used %","Status"].map(h => (
                            <th key={h} className="px-3 py-3 text-left text-xs font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vmData.filter(r => r.drive?.match(/^[A-H]$/)).map((r, i) => {
                          const pctVal = Number(r.used_pct) || 0
                          return (
                            <tr key={i} className={`border-t ${i%2===0?"bg-white":"bg-violet-50/20"} hover:bg-violet-50/50`}>
                              <td className="px-3 py-2.5 text-xs font-black text-violet-700">{r.vm}</td>
                              <td className="px-3 py-2.5 text-xs font-bold text-gray-600">{r.drive}</td>
                              <td className="px-3 py-2.5 text-xs text-center text-gray-600">{r.total_gb ?? "—"}</td>
                              <td className="px-3 py-2.5 text-xs text-center text-gray-600">{r.free_gb ?? "—"}</td>
                              <td className="px-3 py-2.5 text-xs text-center font-bold text-gray-700">{r.used_gb ?? "—"}</td>
                              <td className="px-3 py-2.5 text-xs text-center">
                                <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${pctVal>=90?"bg-red-100 text-red-700":pctVal>=75?"bg-amber-100 text-amber-700":"bg-emerald-100 text-emerald-700"}`}>
                                  {r.used_pct ?? "—"}%
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-xs">
                                {pctVal>=90 ? "🔴 Critical" : pctVal>=75 ? "🟡 Warning" : pctVal>0 ? "🟢 OK" : "⚪ No Data"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          OWN CLOUD TAB
      ══════════════════════════════════════════════ */}
      {mainTab === "owncloud" && (
        <div className="space-y-5">
          <OwnCloudView />
        </div>
      )}

    </div>
  )
}