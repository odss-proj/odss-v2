"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid
} from "recharts"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Group = "G1" | "G2" | "R&D" | "DSO"
type Tab   = "home" | "backlog" | "sprint" | "bugs" | "otd"

interface CodaRow {
  group_dev: string; status_dev: string; dev_pic: string
  application: string; tshirt_sizing: string; dev_point: number
  bobot_dokumen: number; dev_point_bugs: number; quartal: string
  flag_bugs: boolean; flag_on_time: boolean; flag_testing: string
  flag_pilot: string; flag_done_dev: string; doc_name: string
  doc_type: string; year_request: number; plan_pilot: string
  dev_sprint_ds: string; doc_date: string; deadline: string
}

interface SprintRow {
  sprint: string; sprint_pic: string; dev_pic_pb: string
  pct_sprint: number; pct_exp_result: number; dev_point_pb: number
  work_complete_pb: number; is_plan: boolean; status_dev_pb: string
  tshirt_sizing_pb: string; product_backlog: string; adop_project_backlog: string
}

interface BacklogRow {
  dev_group: string; pic_dev: string; application: string
  status_project: string; status_dev: string; request: string
  timeline: string; deadline: string; doc_ref: string
  weekly_sprint: string; flag_sprint: string; flag_tracking: string
  pct_work_complete: number
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const GROUPS: Group[] = ["G1", "G2", "R&D", "DSO"]

const GROUP_META: Record<Group, { color: string; bg: string; light: string; gradient: string; prefix: string }> = {
  "G1":  { color: "#3b82f6", bg: "bg-blue-500",   light: "bg-blue-50",   gradient: "from-blue-500 to-blue-700",   prefix: "G1" },
  "G2":  { color: "#8b5cf6", bg: "bg-violet-500", light: "bg-violet-50", gradient: "from-violet-500 to-purple-700", prefix: "G2" },
  "R&D": { color: "#10b981", bg: "bg-emerald-500", light: "bg-emerald-50", gradient: "from-emerald-500 to-teal-700", prefix: "RD" },
  "DSO": { color: "#f59e0b", bg: "bg-amber-500",   light: "bg-amber-50",  gradient: "from-amber-500 to-orange-600", prefix: "DS" },
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "home",    label: "Home",          icon: "🏠" },
  { key: "backlog", label: "Backlog",       icon: "📋" },
  { key: "sprint",  label: "Sprint",        icon: "🏃" },
  { key: "bugs",    label: "Bug Rate",      icon: "🐛" },
  { key: "otd",     label: "On Time Dev",   icon: "⏱️" },
]

const STATUS_DONE    = ["RELEASE", "DONE"]
const STATUS_PILOT   = ["PILOT"]
const STATUS_PROGRESS= ["OPEN TEST","READY TO PILOT","DONE DEV","OPG TEST","OPEN COMPILE","OPEN TESTING PILOT","READY TO TESTING PILOT","OK + NOTE","OPEN REVIEW","OPG DEV"]
const STATUS_OPEN    = ["OPEN DEV","OPEN"]
const STATUS_BLOCKED = ["HOLD","CANCEL","NOT OK","ROLLBACK"]

const STATUS_COLOR: Record<string, string> = {
  "RELEASE": "bg-green-100 text-green-700", "DONE": "bg-green-100 text-green-700",
  "PILOT": "bg-blue-100 text-blue-700", "OPEN TEST": "bg-cyan-100 text-cyan-700",
  "READY TO PILOT": "bg-indigo-100 text-indigo-700", "DONE DEV": "bg-teal-100 text-teal-700",
  "OPEN DEV": "bg-yellow-100 text-yellow-700", "OPG DEV": "bg-yellow-100 text-yellow-700",
  "OPEN": "bg-gray-100 text-gray-600", "HOLD": "bg-red-100 text-red-600",
  "CANCEL": "bg-red-100 text-red-600", "NOT OK": "bg-red-100 text-red-600",
}

const getStatusGroup = (s: string) => {
  if (STATUS_DONE.includes(s))     return "done"
  if (STATUS_PILOT.includes(s))    return "pilot"
  if (STATUS_PROGRESS.includes(s)) return "progress"
  if (STATUS_OPEN.includes(s))     return "open"
  if (STATUS_BLOCKED.includes(s))  return "blocked"
  return "other"
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0
const fmt  = (n: number) => n.toLocaleString("id-ID")

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  )
}

const CHART_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899"]

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function DashboardDev() {
  const [activeGroup, setActiveGroup] = useState<Group>("G1")
  const [activeTab,   setActiveTab]   = useState<Tab>("home")
  const [coda,        setCoda]        = useState<CodaRow[]>([])
  const [sprints,     setSprints]     = useState<SprintRow[]>([])
  const [backlogs,    setBacklogs]    = useState<BacklogRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState("")
  const [page,        setPage]        = useState(1)
  const PAGE = 15

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [c, s, b] = await Promise.all([
        supabase.from("data_source_coda").select("*").limit(5000),
        supabase.from("data_source_dev_sprint").select("*").limit(10000),
        supabase.from("data_source_project_backlog").select("*").limit(2000),
      ])
      if (c.data) setCoda(c.data as CodaRow[])
      if (s.data) setSprints(s.data as SprintRow[])
      if (b.data) setBacklogs(b.data as BacklogRow[])
      setLoading(false)
    }
    load()
  }, [])

  // Filter by active group
  const meta    = GROUP_META[activeGroup]
  const prefix  = meta.prefix

  const groupCoda = coda.filter(r => r.group_dev === activeGroup)
  const groupSprint = sprints.filter(r => r.sprint?.startsWith(prefix))
  const groupBacklog = backlogs.filter(r => {
    const g = r.dev_group || ""
    return g === activeGroup || g.startsWith(activeGroup + ",") || g.includes("," + activeGroup)
  })

  // ── Core KPIs ──
  const total       = groupCoda.length
  const doneCount   = groupCoda.filter(r => STATUS_DONE.includes(r.status_dev)).length
  const pilotCount  = groupCoda.filter(r => r.status_dev === "PILOT").length
  const progressCount = groupCoda.filter(r => STATUS_PROGRESS.includes(r.status_dev)).length
  const openCount   = groupCoda.filter(r => STATUS_OPEN.includes(r.status_dev)).length
  const blockedCount= groupCoda.filter(r => STATUS_BLOCKED.includes(r.status_dev)).length
  const bugsCount   = groupCoda.filter(r => r.flag_bugs === true).length
  const ontimeCount = groupCoda.filter(r => r.flag_on_time === true).length
  const totalBobot  = groupCoda.reduce((a, r) => a + (Number(r.bobot_dokumen) || 0), 0)
  const totalDP     = groupCoda.reduce((a, r) => a + (Number(r.dev_point) || 0), 0)
  const bcr         = pct(doneCount + pilotCount, total)
  const bugRate     = pct(bugsCount, total)
  const otdRate     = pct(ontimeCount, total)

  // ── Status breakdown for chart ──
  const statusChart = Object.entries(
    groupCoda.reduce((acc, r) => { acc[r.status_dev] = (acc[r.status_dev] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  // ── App breakdown ──
  const appChart = Object.entries(
    groupCoda.reduce((acc, r) => { if (r.application) acc[r.application] = (acc[r.application] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }))

  // ── Sprint SFR trend ──
  const sprintTrend = Object.entries(
    groupSprint.reduce((acc, r) => {
      if (!r.sprint) return acc
      if (!acc[r.sprint]) acc[r.sprint] = { total: 0, sum: 0, dp: 0 }
      acc[r.sprint].total++
      acc[r.sprint].sum += Number(r.pct_sprint) || 0
      acc[r.sprint].dp  += Number(r.dev_point_pb) || 0
      return acc
    }, {} as Record<string, { total: number; sum: number; dp: number }>)
  ).map(([sprint, v]) => ({
    sprint: sprint.replace(`${prefix}-`, "").replace("2026-", ""),
    sfr: Math.round((v.sum / v.total) * 100),
    dp: v.dp,
    items: v.total,
  })).sort((a, b) => a.sprint.localeCompare(b.sprint))

  // ── Backlog status ──
  const backlogStatusChart = Object.entries(
    groupBacklog.reduce((acc, r) => { if (r.status_project) acc[r.status_project] = (acc[r.status_project] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  // ── PIC stats ──
  const picStats = Object.entries(
    groupCoda.reduce((acc, r) => {
      const pic = (r.dev_pic || "").split(",")[0].trim()
      if (!pic || pic.length < 2) return acc
      if (!acc[pic]) acc[pic] = { total: 0, done: 0, bugs: 0, ontime: 0 }
      acc[pic].total++
      if (STATUS_DONE.includes(r.status_dev)) acc[pic].done++
      if (r.flag_bugs === true) acc[pic].bugs++
      if (r.flag_on_time === true) acc[pic].ontime++
      return acc
    }, {} as Record<string, { total: number; done: number; bugs: number; ontime: number }>)
  ).map(([pic, v]) => ({ pic, ...v, rate: pct(v.done, v.total) }))
   .filter(p => p.total >= 3)
   .sort((a, b) => b.total - a.total)

  // ── Table data ──
  const tableData = groupCoda.filter(r =>
    !search || r.doc_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.dev_pic?.toLowerCase().includes(search.toLowerCase()) ||
    r.application?.toLowerCase().includes(search.toLowerCase()) ||
    r.status_dev?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE))
  const pageData   = tableData.slice((page - 1) * PAGE, page * PAGE)

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: meta.color, borderTopColor: "transparent" }} />
      <p className="text-sm text-gray-400">Memuat data Developer...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── GROUP SELECTOR ── */}
      <div className="flex gap-2 flex-wrap">
        {GROUPS.map(g => {
          const m = GROUP_META[g]
          const isActive = activeGroup === g
          return (
            <button key={g} onClick={() => { setActiveGroup(g); setActiveTab("home"); setPage(1) }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                isActive
                  ? `text-white border-transparent shadow-lg`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
              style={isActive ? { background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` } : {}}>
              {g}
            </button>
          )
        })}
      </div>

      {/* ── GROUP HEADER BANNER ── */}
      <div className={`rounded-2xl p-6 bg-gradient-to-r ${meta.gradient} text-white relative overflow-hidden`}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10 -translate-y-1/4 translate-x-1/4"
          style={{ background: "white" }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Developer Team</p>
            <h2 className="text-3xl font-black tracking-tight">{activeGroup}</h2>
            <p className="text-white/70 text-sm mt-1">{total} dokumen total · {groupSprint.length} sprint entries · {groupBacklog.length} backlog items</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-3xl font-black">{bcr}%</p>
              <p className="text-white/70 text-xs mt-0.5">BCR</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-3xl font-black">{bugRate}%</p>
              <p className="text-white/70 text-xs mt-0.5">Bug Rate</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-3xl font-black">{otdRate}%</p>
              <p className="text-white/70 text-xs mt-0.5">OTD</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setPage(1) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === t.key
                ? "text-white shadow-sm"
                : "bg-white border text-gray-500 hover:bg-gray-50"
            }`}
            style={activeTab === t.key ? { backgroundColor: meta.color } : {}}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════
          TAB: HOME
      ══════════════════════════════ */}
      {activeTab === "home" && (
        <div className="space-y-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Total Dokumen"  value={fmt(total)}       sub="Semua status"        color={meta.light} icon="📄" />
            <KpiCard label="Release / Done" value={fmt(doneCount)}   sub={`${pct(doneCount,total)}% dari total`}  color="bg-green-50"  icon="✅" />
            <KpiCard label="On Progress"    value={fmt(progressCount + pilotCount)} sub="Pilot, Test, Dev" color="bg-blue-50"   icon="🔵" />
            <KpiCard label="Open / Backlog" value={fmt(openCount)}   sub={blockedCount > 0 ? `+ ${blockedCount} blocked` : "Semua berjalan"} color="bg-yellow-50" icon="⏳" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Total Bobot"    value={fmt(totalBobot)}  sub="Bobot dokumen"       color="bg-purple-50" icon="⚖️" />
            <KpiCard label="Total Dev Point" value={fmt(totalDP)}    sub="Development points"   color="bg-indigo-50" icon="💎" />
            <KpiCard label="Bug Rate"       value={`${bugRate}%`}    sub={`${bugsCount} dokumen buggy`} color="bg-red-50"    icon="🐛" />
            <KpiCard label="On Time Dev"    value={`${otdRate}%`}    sub={`${ontimeCount} tepat waktu`} color="bg-teal-50"   icon="⏱️" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-5">

            {/* Status Distribution */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Distribusi Status Dev</h3>
              <p className="text-xs text-gray-400 mb-4">{total} dokumen total</p>
              {/* Progress bars */}
              <div className="space-y-2 mb-4">
                {[
                  { label: "Release/Done", count: doneCount,    color: "#22c55e" },
                  { label: "Pilot",        count: pilotCount,   color: meta.color },
                  { label: "On Progress",  count: progressCount, color: "#3b82f6" },
                  { label: "Open",         count: openCount,    color: "#f59e0b" },
                  { label: "Blocked",      count: blockedCount, color: "#ef4444" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 text-right shrink-0">{s.label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="h-5 rounded-full flex items-center pl-2 transition-all"
                        style={{ width: `${pct(s.count, total)}%`, backgroundColor: s.color, minWidth: s.count > 0 ? "2rem" : 0 }}>
                        {s.count > 0 && <span className="text-white text-xs font-semibold">{s.count}</span>}
                      </div>
                    </div>
                    <div className="w-10 text-xs text-gray-400 text-right shrink-0">{pct(s.count, total)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Applications */}
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Top Aplikasi</h3>
              <p className="text-xs text-gray-400 mb-3">Berdasarkan jumlah dokumen</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={appChart} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => [`${v} dok`, "Total"]} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {appChart.map((_, i) => <Cell key={i} fill={meta.color} fillOpacity={1 - i * 0.07} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* PIC Performance Table */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Performance per Developer</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white text-xs" style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)` }}>
                    <th className="px-4 py-3 text-left">Developer</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Done</th>
                    <th className="px-4 py-3 text-center">Done Rate</th>
                    <th className="px-4 py-3 text-center">Bugs</th>
                    <th className="px-4 py-3 text-center">On Time</th>
                    <th className="px-4 py-3 text-left">Progress Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {picStats.map((p, i) => (
                    <tr key={p.pic} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                      <td className="px-4 py-3 font-medium text-gray-800 text-sm">{p.pic}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{p.total}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-medium">{p.done}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.rate >= 70 ? "bg-green-100 text-green-700" : p.rate >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                          {p.rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.bugs > 0 ? <span className="text-red-500 font-bold">{p.bugs}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${pct(p.ontime, p.total) >= 70 ? "text-green-600" : "text-yellow-600"}`}>
                          {pct(p.ontime, p.total)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 w-40">
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                          <div className="h-3 bg-green-400" style={{ width: `${pct(p.done, p.total)}%` }} />
                          <div className="h-3 bg-blue-400" style={{ width: `${pct(p.total - p.done, p.total)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════
          TAB: BACKLOG
      ══════════════════════════════ */}
      {activeTab === "backlog" && (
        <div className="space-y-5">

          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Total Backlog"  value={groupBacklog.length} sub="Semua request"      color={meta.light}   icon="📋" />
            <KpiCard label="In Progress"    value={groupBacklog.filter(r => ["OPG TEST","OPG DEV","OPEN DEV","OPEN DR","REVIEW BR"].includes(r.status_project)).length} sub="Sedang dikerjakan" color="bg-blue-50"   icon="⚙️" />
            <KpiCard label="Pilot / Release" value={groupBacklog.filter(r => ["PILOT","OPEN PILOT","RELEASE"].includes(r.status_project)).length} sub="Hampir selesai" color="bg-green-50"  icon="🚀" />
            <KpiCard label="Open / Waiting" value={groupBacklog.filter(r => r.status_project === "OPEN").length} sub="Belum dimulai"  color="bg-yellow-50" icon="⏳" />
          </div>

          {/* Status Backlog Chart */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Status Project Backlog</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={backlogStatusChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {backlogStatusChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Distribusi Status (Pie)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={backlogStatusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {backlogStatusChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Backlog Table */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Daftar Project Backlog ({groupBacklog.length})</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white text-xs" style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)` }}>
                    <th className="px-3 py-3 text-left">#</th>
                    <th className="px-3 py-3 text-left">Request</th>
                    <th className="px-3 py-3 text-left">Aplikasi</th>
                    <th className="px-3 py-3 text-left">PIC Dev</th>
                    <th className="px-3 py-3 text-center">Status Project</th>
                    <th className="px-3 py-3 text-center">Status Dev</th>
                    <th className="px-3 py-3 text-center">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {groupBacklog.slice(0, 50).map((r, i) => (
                    <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                      <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate text-xs">{r.request}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{r.application}</td>
                      <td className="px-3 py-2 text-gray-700 text-xs max-w-[140px] truncate">{r.pic_dev?.split(",")[0]}</td>
                      <td className="px-3 py-2 text-center"><StatusBadge status={r.status_project || ""} /></td>
                      <td className="px-3 py-2 text-center"><StatusBadge status={r.status_dev || ""} /></td>
                      <td className="px-3 py-2 text-center text-xs text-gray-500">{r.timeline || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {groupBacklog.length > 50 && <p className="text-xs text-gray-400 mt-3 text-center">Menampilkan 50 dari {groupBacklog.length} item</p>}
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          TAB: SPRINT
      ══════════════════════════════ */}
      {activeTab === "sprint" && (
        <div className="space-y-5">

          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Total Sprint"   value={[...new Set(groupSprint.map(r => r.sprint))].length} sub="Sprint unik" color={meta.light} icon="🏃" />
            <KpiCard label="Sprint Items"   value={groupSprint.length}   sub="Total entri sprint"    color="bg-blue-50"   icon="📌" />
            <KpiCard label="Avg SFR"        value={`${Math.round(groupSprint.reduce((a, r) => a + (Number(r.pct_sprint) || 0), 0) / (groupSprint.length || 1) * 100)}%`} sub="Sprint Fulfillment" color="bg-green-50" icon="✅" />
            <KpiCard label="Total Dev Point" value={fmt(groupSprint.reduce((a, r) => a + (Number(r.dev_point_pb) || 0), 0))} sub="Semua sprint" color="bg-purple-50" icon="💎" />
          </div>

          {/* SFR Trend */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Sprint Fulfillment Rate (SFR) Trend</h3>
            <p className="text-xs text-gray-400 mb-4">% target terpenuhi per sprint</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sprintTrend} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "SFR"]} />
                <Line type="monotone" dataKey="sfr" stroke={meta.color} strokeWidth={3}
                  dot={{ fill: meta.color, r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dev Point per Sprint */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Dev Point per Sprint (Velocity)</h3>
            <p className="text-xs text-gray-400 mb-4">Total dev point dikerjakan per sprint</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sprintTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="dp" name="Dev Point" radius={[6,6,0,0]} fill={meta.color} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sprint Detail Table */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Detail Sprint Items</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white text-xs" style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)` }}>
                    <th className="px-3 py-3 text-left">Sprint</th>
                    <th className="px-3 py-3 text-left">PIC</th>
                    <th className="px-3 py-3 text-left">Backlog</th>
                    <th className="px-3 py-3 text-center">DP</th>
                    <th className="px-3 py-3 text-center">SFR</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">Is Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {groupSprint.slice(0, 50).map((r, i) => (
                    <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                      <td className="px-3 py-2 text-xs font-mono text-gray-500">{r.sprint}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{r.sprint_pic}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-[200px] truncate">{r.product_backlog}</td>
                      <td className="px-3 py-2 text-center text-xs font-medium" style={{ color: meta.color }}>{r.dev_point_pb || "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Number(r.pct_sprint) >= 1 ? "bg-green-100 text-green-700" : Number(r.pct_sprint) >= 0.7 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                          {Math.round(Number(r.pct_sprint) * 100)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center"><StatusBadge status={r.status_dev_pb || ""} /></td>
                      <td className="px-3 py-2 text-center text-xs">{r.is_plan ? "✅" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {groupSprint.length > 50 && <p className="text-xs text-gray-400 mt-3 text-center">Menampilkan 50 dari {groupSprint.length} item</p>}
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          TAB: BUG RATE
      ══════════════════════════════ */}
      {activeTab === "bugs" && (
        <div className="space-y-5">

          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Bug Rate"       value={`${bugRate}%`}     sub={`${bugsCount} dari ${total} dok`} color="bg-red-50"    icon="🐛" />
            <KpiCard label="Total Buggy"    value={bugsCount}          sub="Dokumen dengan bug"           color="bg-orange-50" icon="⚠️" />
            <KpiCard label="Clean Docs"     value={total - bugsCount}  sub="Tanpa bug"                   color="bg-green-50"  icon="✅" />
            <KpiCard label="Total Dev Point Bugs" value={fmt(groupCoda.reduce((a,r) => a + (Number(r.dev_point_bugs)||0), 0))} sub="Dev point terpengaruh" color="bg-purple-50" icon="💢" />
          </div>

          {/* Bug detail per developer */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Bug Rate per Developer</h3>
            <p className="text-xs text-gray-400 mb-4">Jumlah bug dan persentase dari total dokumen masing-masing</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={picStats.filter(p => p.total >= 5)} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="pic" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bugs" name="Bug Count" radius={[6,6,0,0]} fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bug docs table */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Dokumen dengan Bug ({bugsCount})</h3>
            {bugsCount === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-medium">Tidak ada bug ditemukan!</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-500 text-white text-xs">
                      <th className="px-3 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">Dokumen</th>
                      <th className="px-3 py-3 text-left">Dev PIC</th>
                      <th className="px-3 py-3 text-left">Aplikasi</th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-3 py-3 text-center">Dev Point Bugs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupCoda.filter(r => r.flag_bugs === true).map((r, i) => (
                      <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-red-50"}`}>
                        <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 max-w-[220px] truncate">{r.doc_name}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{r.dev_pic?.split(",")[0]}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{r.application}</td>
                        <td className="px-3 py-2 text-center"><StatusBadge status={r.status_dev || ""} /></td>
                        <td className="px-3 py-2 text-center text-red-600 font-bold text-xs">{r.dev_point_bugs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════
          TAB: ON TIME DEV
      ══════════════════════════════ */}
      {activeTab === "otd" && (
        <div className="space-y-5">

          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="OTD Rate"       value={`${otdRate}%`}     sub="On Time Development"          color={meta.light}   icon="⏱️" />
            <KpiCard label="Tepat Waktu"    value={ontimeCount}        sub="Dokumen on time"              color="bg-green-50"  icon="✅" />
            <KpiCard label="Terlambat"      value={total - ontimeCount} sub="Dokumen late"                color="bg-red-50"    icon="⚠️" />
            <KpiCard label="Total Dokumen"  value={total}              sub="Dengan deadline"              color="bg-gray-50"   icon="📄" />
          </div>

          {/* OTD per developer */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-1">On Time Delivery per Developer</h3>
            <p className="text-xs text-gray-400 mb-4">% dokumen selesai tepat waktu</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={picStats.filter(p => p.total >= 5).map(p => ({ ...p, otd: pct(p.ontime, p.total) }))} margin={{ bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="pic" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "OTD Rate"]} />
                <Bar dataKey="otd" name="OTD %" radius={[6,6,0,0]}>
                  {picStats.filter(p => p.total >= 5).map((p, i) => (
                    <Cell key={i} fill={pct(p.ontime, p.total) >= 70 ? "#22c55e" : pct(p.ontime, p.total) >= 50 ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* OTD Detail Table */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Daftar Semua Dokumen</h3>
              <input type="text" placeholder="Cari dokumen, PIC, aplikasi..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="border rounded-xl px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-blue-400" />
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white text-xs" style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)` }}>
                    <th className="px-3 py-3 text-left">#</th>
                    <th className="px-3 py-3 text-left">Dokumen</th>
                    <th className="px-3 py-3 text-left">Dev PIC</th>
                    <th className="px-3 py-3 text-left">Aplikasi</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">On Time</th>
                    <th className="px-3 py-3 text-center">Quartal</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((r, i) => (
                    <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}>
                      <td className="px-3 py-2 text-gray-400 text-xs">{(page - 1) * PAGE + i + 1}</td>
                      <td className="px-3 py-2 text-xs text-gray-700 max-w-[220px] truncate">{r.doc_name}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{r.dev_pic?.split(",")[0]}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{r.application}</td>
                      <td className="px-3 py-2 text-center"><StatusBadge status={r.status_dev || ""} /></td>
                      <td className="px-3 py-2 text-center text-xs">
                        {r.flag_on_time === true ? "✅" : <span className="text-red-400">❌</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-gray-500">{r.quartal || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">Halaman {page} dari {totalPages} ({tableData.length} dokumen)</p>
                <div className="flex gap-1.5">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">←</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let p = idx + 1
                    if (totalPages > 5 && page > 3) p = page - 2 + idx
                    if (p > totalPages) return null
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className="px-3 py-1.5 rounded-lg border text-sm"
                        style={p === page ? { backgroundColor: meta.color, color: "white", borderColor: meta.color } : {}}>
                        {p}
                      </button>
                    )
                  })}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">→</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}