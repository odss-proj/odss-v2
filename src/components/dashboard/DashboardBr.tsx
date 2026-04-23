"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "../../lib/supabase"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts"
import { calculateGrades, GRADE_CONFIG, type GradeResult } from "../../lib/gradeSystem"

type MainTab = "home" | "application" | "service" | "stability"

interface CodaRow {
  id: number; flag_report: string; req_type: string; year_request: number; quartal: string
  application: string; appx: string; doc_date: string; doc_type: string
  doc_no: string; doc_name: string; description: string
  status_dev: string; status_project: string; user_name: string
  user_request: string; project: string; br_pic: string; task_pic_2: string
  testing_pic_1: string; testing_pic_2: string; testing_pic_3: string
  dev_pic: string; pilot: string; release: string; year_done: number
  bobot_dokumen: number; bobot_testing_pic_1: number; bobot_testing_pic_2: number; bobot_testing_pic_3: number
  bobot_test1_2026: number; test1_done_2026: number; bobot_test2_2026: number; test2_done_2026: number
  bobot_test3_2026: number; test3_done_2026: number
}
interface LogixRow {
  id: number; date_logs: string; email: string; user_name: string
  kd_branch: string; branch: string; pic_branch: string
  nomor_ticket: string; ticket_created_date: string; ticket_created_detail: string; ticket_created_in_s: number
  severity: string; type_supporting: string; sub_type_supporting: string
  detail_issue: string; aplikasi: string; modul: string; menu: string
  status_ticket: string; last_state: string
  ticket_close_date: string; ticket_close_detail: string; ticket_close_in_s: number
  ticket_durasi: string; ticket_durasi_in_s: number
  default_respon_time: string; default_respon_time_by_severity: string
  tas_pic: string; tas_respon_time: string; tas_respon_time_in_s: number
  br_pic: string; br_respon_time: string; br_respon_time_in_s: number
  dev_pic: string; dev_respon_time: string; dev_respon_time_in_s: number
  durasi_ticket_hari: number; ticket_created_month: string
  judul_ticket: string; deskripsi_ticket: string; note_br: string; solved_by: string; fileset: string
}

const BR_MEMBERS = [
  { name:"Yonathan", color:"#6366f1", short:"YON", emoji:"👨‍💻" },
  { name:"Imam",     color:"#10b981", short:"IMA", emoji:"🧑‍💻" },
  { name:"Dika",     color:"#f59e0b", short:"DIK", emoji:"👩‍💻" },
  { name:"Afif",     color:"#ef4444", short:"AFI", emoji:"🧑‍💻" },
  { name:"Mario",    color:"#8b5cf6", short:"MAR", emoji:"👨‍💻" },
]
const BR_NAMES = BR_MEMBERS.map(m => m.name)
const CHART_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"]
const SDC: Record<string,string> = { "PILOT":"#3b82f6","RELEASE":"#10b981","DONE":"#10b981","DEV":"#f59e0b","REVIEW":"#8b5cf6","OPEN":"#6b7280","CANCEL":"#ef4444","HOLD":"#64748b" }
const SVC: Record<string,string> = { "Critical":"#dc2626","High":"#f97316","Medium":"#eab308","Low":"#22c55e" }

const sToHms = (s: number) => { if(!s||s<=0) return "—"; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}j ${m}m`:`${m}m` }
const pct  = (n: number, d: number) => d>0?Math.round((n/d)*100):0
const mClr = (name: string) => BR_MEMBERS.find(m=>m.name===name)?.color||"#6b7280"
const isBR = (v: string|null|undefined, n: string) => (v||"").toLowerCase().includes(n.toLowerCase())
const matchC = (r: CodaRow,  n: string) => isBR(r.br_pic,n)||isBR(r.testing_pic_1,n)||isBR(r.testing_pic_2,n)||isBR(r.testing_pic_3,n)
const matchL = (r: LogixRow, n: string) => isBR(r.br_pic,n)

// ── Modal wrapper ──────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }: { open:boolean; onClose:()=>void; title:string; children:React.ReactNode; wide?:boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:"rgba(0,0,0,0.55)" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div className={`bg-white rounded-2xl shadow-2xl flex flex-col ${wide?"w-full max-w-4xl":"w-full max-w-2xl"}`} style={{ maxHeight:"90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="font-bold text-gray-800 text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold">✕</button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  )
}

function DR({ label, value, mono }: { label:string; value?:string|number|null; mono?:boolean }) {
  if (!value && value!==0) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50">
      <span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-800 flex-1 ${mono?"font-mono":"font-medium"}`}>{String(value)}</span>
    </div>
  )
}
function SBadge({ s }: { s:string }) {
  const c = SDC[(s||"").toUpperCase()]||"#6b7280"
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor:`${c}20`,color:c }}>{s||"—"}</span>
}
function SevBadge({ s }: { s:string }) {
  const c = SVC[s]||"#6b7280"
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor:`${c}20`,color:c }}>{s||"—"}</span>
}

// ── Coda detail modal ──────────────────────────────────────────────
function CodaModal({ row, onClose }: { row:CodaRow|null; onClose:()=>void }) {
  if (!row) return null
  return (
    <Modal open title={`📄 ${row.doc_no||"Detail Dokumen"}`} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-x-8">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Info Dokumen</p>
          <DR label="Doc No"       value={row.doc_no} mono/><DR label="Doc Name"    value={row.doc_name}/>
          <DR label="Doc Type"     value={row.doc_type}/><DR label="Doc Date"     value={row.doc_date}/>
          <DR label="Application"  value={row.application}/><DR label="Description" value={row.description}/>
          <DR label="User"         value={row.user_name}/><DR label="User Request" value={row.user_request}/>
          <DR label="Project"      value={row.project}/><DR label="Req. Type"   value={row.req_type}/>
          <DR label="Quartal"      value={row.quartal}/><DR label="Year Request" value={row.year_request}/>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status & PIC</p>
          <div className="flex gap-2 py-2 border-b border-gray-50"><span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">Status Dev</span><SBadge s={row.status_dev}/></div>
          <div className="flex gap-2 py-2 border-b border-gray-50"><span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">Status Project</span><SBadge s={row.status_project}/></div>
          <DR label="BR PIC" value={row.br_pic}/><DR label="Task PIC 2" value={row.task_pic_2}/>
          <DR label="Testing PIC 1" value={row.testing_pic_1}/><DR label="Testing PIC 2" value={row.testing_pic_2}/>
          <DR label="Testing PIC 3" value={row.testing_pic_3}/><DR label="Dev PIC" value={row.dev_pic}/>
          <DR label="Pilot" value={row.pilot}/><DR label="Release" value={row.release}/><DR label="Year Done" value={row.year_done}/>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Bobot Testing 2026</p>
          {([
            { label:"Test 1", b:row.bobot_test1_2026, d:row.test1_done_2026 },
            { label:"Test 2", b:row.bobot_test2_2026, d:row.test2_done_2026 },
            { label:"Test 3", b:row.bobot_test3_2026, d:row.test3_done_2026 },
          ].map(t => t.b ? (
            <div key={t.label} className="flex gap-3 py-2 border-b border-gray-50 items-center">
              <span className="text-xs text-gray-400 w-36 shrink-0">{t.label}</span>
              <span className="text-sm font-bold text-gray-700">{t.b}</span>
              <span className="text-xs text-gray-400 w-12">done:{t.d||0}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full bg-indigo-500" style={{ width:`${pct(t.d||0,t.b)}%` }}/></div>
              <span className="text-xs text-indigo-600 font-bold w-8 text-right">{pct(t.d||0,t.b)}%</span>
            </div>
          ) : null))}
        </div>
      </div>
    </Modal>
  )
}

// ── Logix detail modal ─────────────────────────────────────────────
function LogixModal({ row, onClose }: { row:LogixRow|null; onClose:()=>void }) {
  if (!row) return null
  return (
    <Modal open title={`🎫 ${row.nomor_ticket||"Detail Tiket"}`} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-x-8">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Info Tiket</p>
          <DR label="No Tiket" value={row.nomor_ticket} mono/><DR label="Judul" value={row.judul_ticket}/>
          <DR label="Deskripsi" value={row.deskripsi_ticket}/><DR label="Detail Issue" value={row.detail_issue}/>
          <DR label="Aplikasi" value={row.aplikasi}/><DR label="Modul" value={row.modul}/>
          <DR label="Menu" value={row.menu}/>
          <div className="flex gap-2 py-2 border-b border-gray-50"><span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">Severity</span><SevBadge s={row.severity}/></div>
          <DR label="Type" value={row.type_supporting}/><DR label="Sub Type" value={row.sub_type_supporting}/>
          <DR label="Branch" value={row.branch}/><DR label="PIC Branch" value={row.pic_branch}/>
          <DR label="Created" value={row.ticket_created_date}/><DR label="Close Date" value={row.ticket_close_date}/>
          <DR label="Bulan" value={row.ticket_created_month}/>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status & SLA</p>
          <div className="flex gap-2 py-2 border-b border-gray-50">
            <span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(row.status_ticket||"").toLowerCase().includes("close")?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{row.status_ticket||"—"}</span>
          </div>
          <DR label="Last State" value={row.last_state}/><DR label="Durasi" value={row.ticket_durasi}/>
          <DR label="Durasi (hari)" value={row.durasi_ticket_hari}/>
          <DR label="Default Respon" value={row.default_respon_time_by_severity}/>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Respon PIC</p>
          {[
            { label:"TAS PIC", pic:row.tas_pic, respon:row.tas_respon_time },
            { label:"BR PIC",  pic:row.br_pic,  respon:row.br_respon_time  },
            { label:"Dev PIC", pic:row.dev_pic, respon:row.dev_respon_time },
          ].map(p => (
            <div key={p.label} className="flex gap-3 py-2 border-b border-gray-50 items-center">
              <span className="text-xs text-gray-400 w-36 shrink-0">{p.label}</span>
              <span className="text-sm font-semibold text-gray-700 flex-1">{p.pic||"—"}</span>
              <span className="text-xs font-mono text-gray-500">{p.respon||"—"}</span>
            </div>
          ))}
          <DR label="Solved By" value={row.solved_by}/><DR label="Note BR" value={row.note_br}/>
          <DR label="Close Detail" value={row.ticket_close_detail}/>
        </div>
      </div>
    </Modal>
  )
}

// ── Search bar ─────────────────────────────────────────────────────
function SearchBar({ search, onSearch, filters, onFilter, filterOpts }: {
  search: string; onSearch: (v:string)=>void
  filters: Record<string,string>; onFilter: (k:string,v:string)=>void
  filterOpts: { key:string; label:string; options:string[] }[]
}) {
  const hasFilter = search || Object.values(filters).some(Boolean)
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-48">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Cari..."
          className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"/>
      </div>
      {filterOpts.map(f=>(
        <select key={f.key} value={filters[f.key]||""} onChange={e=>onFilter(f.key,e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm focus:outline-none bg-white text-gray-600">
          <option value="">{f.label}</option>
          {f.options.filter(Boolean).map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ))}
      {hasFilter && (
        <button onClick={()=>{ onSearch(""); filterOpts.forEach(f=>onFilter(f.key,"")) }}
          className="px-3 py-2 rounded-xl border text-xs text-gray-500 hover:bg-gray-50">✕ Reset</button>
      )}
    </div>
  )
}

// ── Unified Member Modal ─────────────────────────────────────────
function UnifiedMemberModal({ member, docs, tickets, grade, onClose }: {
  member: typeof BR_MEMBERS[0] | null
  docs: CodaRow[]; tickets: LogixRow[]
  grade: GradeResult | null; onClose: () => void
}) {
  if (!member) return null
  const cfg    = grade ? GRADE_CONFIG[grade.grade] : GRADE_CONFIG["D"]
  const done   = docs.filter(r => ["PILOT","RELEASE","DONE"].includes((r.status_dev||"").toUpperCase())).length
  const pilot  = docs.filter(r => (r.pilot||"").trim() !== "").length
  const closed = tickets.filter(r => (r.status_ticket||"").toLowerCase().includes("close")).length
  const avgR   = tickets.length > 0 ? Math.round(tickets.reduce((a,r)=>a+(r.br_respon_time_in_s||0),0)/tickets.length) : 0

  const byApp = Object.entries(docs.reduce((a,r)=>{ a[r.application||"Unknown"]=(a[r.application||"Unknown"]||0)+1; return a },{}as Record<string,number>))
    .map(([n,v])=>({n,v})).sort((a,b)=>b.v-a.v).slice(0,6)
  const byStatus = Object.entries(docs.reduce((a,r)=>{ a[r.status_dev||"?"]=(a[r.status_dev||"?"]||0)+1; return a },{}as Record<string,number>))
    .map(([n,v])=>({n,v})).sort((a,b)=>b.v-a.v)
  const bySev = Object.entries(tickets.reduce((a,r)=>{ a[r.severity||"?"]=(a[r.severity||"?"]||0)+1; return a },{}as Record<string,number>))
    .map(([n,v])=>({n,v})).sort((a,b)=>b.v-a.v)
  const recentDocs    = [...docs].sort((a,b)=>(b.year_request||0)-(a.year_request||0)).slice(0,5)
  const recentTickets = tickets.slice(0,5)

  const scoreMetrics = grade ? [
    { label:"Done Rate",     score:Math.round(grade.scoreDoneRate),    raw:`${grade.doneDok}/${grade.totalDok}`,        w:30, icon:"✅" },
    { label:"Bobot Testing", score:Math.round(grade.scoreBobot),       raw:`${grade.bobotDone}/${grade.bobotTesting}`,  w:25, icon:"⚖️" },
    { label:"Pilot",         score:Math.round(grade.scorePilot),       raw:`${grade.pilotCount} dok`,                   w:20, icon:"✈️" },
    { label:"Ticket Close",  score:Math.round(grade.scoreTicketClose), raw:`${grade.closedTicket}/${grade.totalTicket}`,w:15, icon:"🎫" },
    { label:"Volume Dok",    score:Math.round(grade.scoreTotalDok),    raw:`${grade.totalDok} dok`,                     w:10, icon:"📄" },
  ] : []

  const scoreColor = (s:number) => s>=75?"#10b981":s>=55?"#3b82f6":s>=35?"#f59e0b":"#ef4444"

  return (
    <Modal open title={`${member.emoji} ${member.name}`} onClose={onClose} wide>

      {/* ── TOP: Grade hero strip ── */}
      <div className={`-mx-6 -mt-2 px-6 py-4 text-white bg-gradient-to-r ${cfg.bg} mb-5 flex items-center gap-5`}>
        {/* Grade letter */}
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-5xl font-black backdrop-blur-sm shrink-0">
          {grade?.grade||"—"}
        </div>
        {/* Info */}
        <div className="flex-1">
          <p className="font-black text-lg leading-tight">{cfg.emoji} {cfg.text}</p>
          <p className="text-xs opacity-75 mt-0.5">{cfg.msg}</p>
          {/* Score bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-white/30 rounded-full h-2">
              <div className="h-2 rounded-full bg-white transition-all" style={{ width:`${grade?.totalScore||0}%` }}/>
            </div>
            <span className="text-xs font-black opacity-90">{grade?.totalScore||0}/100</span>
          </div>
        </div>
        {/* Stats row */}
        <div className="flex gap-4 text-center shrink-0">
          {[
            { v:`#${grade?.rank||"—"}`, l:"Ranking"    },
            { v:docs.length,            l:"Total Dok"  },
            { v:`${done}/${docs.length}`,l:"Done"      },
            { v:pilot,                  l:"Pilot"      },
            { v:`${closed}/${tickets.length}`, l:"Tiket Close" },
            { v:sToHms(avgR),           l:"Avg Respon" },
          ].map(s=>(
            <div key={s.l} className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm min-w-[60px]">
              <p className="text-base font-black leading-tight">{s.v}</p>
              <p className="text-xs opacity-70 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MIDDLE: 3 columns ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">

        {/* Col 1: Score breakdown */}
        <div className="col-span-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📊 Score Breakdown</p>
          <div className="space-y-2">
            {scoreMetrics.map(m => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-600">{m.icon} {m.label} <span className="text-gray-400">·{m.w}%</span></span>
                  <span className="text-xs font-black" style={{ color:scoreColor(m.score) }}>{m.score}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width:`${m.score}%`, backgroundColor:scoreColor(m.score) }}/>
                  </div>
                  <span className="text-xs text-gray-400 w-14 text-right shrink-0">{m.raw}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-indigo-50 rounded-lg">
            <p className="text-xs text-indigo-500 leading-relaxed">A≥75 · B≥55 · C≥35 · D&lt;35</p>
          </div>
        </div>

        {/* Col 2: Top Apps */}
        <div className="col-span-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📦 Aplikasi</p>
          <div className="space-y-2">
            {byApp.length > 0 ? byApp.map((a,i)=>(
              <div key={a.n} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor:CHART_COLORS[i%CHART_COLORS.length] }}/>
                <span className="text-xs text-gray-700 flex-1 truncate font-medium">{a.n}</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded" style={{ backgroundColor:`${CHART_COLORS[i%CHART_COLORS.length]}20`, color:CHART_COLORS[i%CHART_COLORS.length] }}>{a.v}</span>
              </div>
            )) : <p className="text-xs text-gray-400 italic">Tidak ada dokumen</p>}
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📋 Status</p>
            <div className="flex flex-wrap gap-1">
              {byStatus.map(s=>{
                const c = (SDC as Record<string,string>)[(s.n||"").toUpperCase()]||"#6b7280"
                return <div key={s.n} className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor:`${c}18`,color:c }}>{s.n} {s.v}</div>
              })}
            </div>
          </div>
        </div>

        {/* Col 3: Service */}
        <div className="col-span-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🎫 Service Level</p>
          {bySev.length > 0 ? (
            <div className="space-y-2 mb-3">
              {bySev.map(s=>{
                const c=(SVC as Record<string,string>)[s.n]||"#6b7280"
                return (
                  <div key={s.n} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor:c }}/>
                    <span className="text-xs text-gray-700 flex-1">{s.n}</span>
                    <span className="text-xs font-black" style={{ color:c }}>{s.v}</span>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-xs text-gray-400 italic mb-3">Tidak ada tiket</p>}
          {/* SLA mini cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:"Total",    val:tickets.length,    color:"#6366f1" },
              { label:"Closed",   val:closed,            color:"#10b981" },
              { label:"Open",     val:tickets.length-closed, color:"#f59e0b" },
              { label:"Avg Resp", val:sToHms(avgR),      color:"#8b5cf6" },
            ].map(s=>(
              <div key={s.label} className="rounded-xl p-2.5 text-center border">
                <p className="text-sm font-black" style={{ color:s.color }}>{s.val}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Recent tables side by side ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Docs */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📄 Dokumen Terkini</p>
          {recentDocs.length > 0 ? (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 border-b">
                  {["Nama","Aplikasi","Status","✈️"].map(h=><th key={h} className="px-2 py-2 text-left text-gray-400 font-semibold">{h}</th>)}
                </tr></thead>
                <tbody>
                  {recentDocs.map((r,i)=>(
                    <tr key={i} className={`border-b last:border-0 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                      <td className="px-2 py-1.5 font-medium text-gray-700 max-w-[120px] truncate">{r.doc_name||"—"}</td>
                      <td className="px-2 py-1.5"><span className="px-1 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs">{r.application||"—"}</span></td>
                      <td className="px-2 py-1.5"><SBadge s={r.status_dev}/></td>
                      <td className="px-2 py-1.5 text-center">{r.pilot?"✈️":"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-xs text-gray-400 italic">Tidak ada dokumen</p>}
        </div>

        {/* Recent Tickets */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">🎫 Tiket Terkini</p>
          {recentTickets.length > 0 ? (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 border-b">
                  {["Judul","Sev","Status","Respon"].map(h=><th key={h} className="px-2 py-2 text-left text-gray-400 font-semibold">{h}</th>)}
                </tr></thead>
                <tbody>
                  {recentTickets.map((r,i)=>(
                    <tr key={i} className={`border-b last:border-0 ${i%2===0?"bg-white":"bg-gray-50/30"}`}>
                      <td className="px-2 py-1.5 text-gray-700 max-w-[130px] truncate">{r.judul_ticket||r.detail_issue||"—"}</td>
                      <td className="px-2 py-1.5"><SevBadge s={r.severity}/></td>
                      <td className="px-2 py-1.5">
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${(r.status_ticket||"").toLowerCase().includes("close")?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600"}`}>
                          {(r.status_ticket||"").toLowerCase().includes("close")?"✓":"⏳"}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-gray-500 text-xs">{r.br_respon_time||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-xs text-gray-400 italic">Tidak ada tiket</p>}
        </div>
      </div>
    </Modal>
  )
}

// ── Main ───────────────────────────────────────────────────────────
export default function DashboardBR() {
  const [tab,    setTab]    = useState<MainTab>("home")
  const [active, setActive] = useState<string|null>(null)
  const [loading,setLoading]= useState(true)
  const [coda,   setCoda]   = useState<CodaRow[]>([])
  const [logix,  setLogix]  = useState<LogixRow[]>([])
  const [page,   setPage]   = useState(1)
  const PAGE = 12

  const [selCoda,   setSelCoda]   = useState<CodaRow|null>(null)
  const [selLogix,  setSelLogix]  = useState<LogixRow|null>(null)
  const [selMember, setSelMember] = useState<typeof BR_MEMBERS[0]|null>(null)

  const [docS,  setDocS]  = useState("")
  const [docF,  setDocF]  = useState<Record<string,string>>({})
  const [tikS,  setTikS]  = useState("")
  const [tikF,  setTikF]  = useState<Record<string,string>>({})
  const [stS,   setStS]   = useState("")

  useEffect(()=>{ const load=async()=>{ setLoading(true); const [c,l]=await Promise.all([supabase.from("coda_main").select("*").limit(5000),supabase.from("logix").select("*").limit(10000)]); if(c.data)setCoda(c.data as CodaRow[]); if(l.data)setLogix(l.data as LogixRow[]); setLoading(false) }; load() },[])

  const brC = useMemo(()=>coda.filter(r=>BR_NAMES.some(n=>matchC(r,n))),[coda])
  const brL = useMemo(()=>logix.filter(r=>BR_NAMES.some(n=>matchL(r,n))),[logix])
  const mC  = (n:string) => [...brC].filter(r=>matchC(r,n))
  const mL  = (n:string) => [...brL].filter(r=>matchL(r,n))

  const stats = useMemo(()=>BR_MEMBERS.map(m=>{
    const d=mC(m.name), t=mL(m.name)
    const done=d.filter(r=>["PILOT","RELEASE","DONE"].includes((r.status_dev||"").toUpperCase())).length
    const pilot=d.filter(r=>(r.pilot||"").trim()!=="").length
    const bobot=d.reduce((a,r)=>{const x=isBR(r.testing_pic_1,m.name)?r.bobot_testing_pic_1:isBR(r.testing_pic_2,m.name)?r.bobot_testing_pic_2:isBR(r.testing_pic_3,m.name)?r.bobot_testing_pic_3:0; return a+(x||0)},0)
    const avgR=t.length>0?Math.round(t.reduce((a,r)=>a+(r.br_respon_time_in_s||0),0)/t.length):0
    const closed=t.filter(r=>(r.status_ticket||"").toLowerCase().includes("close")).length
    return { ...m, docs:d.length, done, pilot, tickets:t.length, closed, bobot:Math.round(bobot), avgR, doneRate:pct(done,d.length) }
  }),[brC,brL])

  // ── Grade System ──────────────────────────────────────────────
  const grades = useMemo(()=> calculateGrades(BR_MEMBERS.map(m => {
    const d = mC(m.name), t = mL(m.name)
    const done  = d.filter(r=>["PILOT","RELEASE","DONE"].includes((r.status_dev||"").toUpperCase())).length
    const pilot = d.filter(r=>(r.pilot||"").trim()!=="").length
    const b1=d.reduce((a,r)=>a+(isBR(r.testing_pic_1,m.name)?(r.bobot_test1_2026||0):0),0)
    const b2=d.reduce((a,r)=>a+(isBR(r.testing_pic_2,m.name)?(r.bobot_test2_2026||0):0),0)
    const b3=d.reduce((a,r)=>a+(isBR(r.testing_pic_3,m.name)?(r.bobot_test3_2026||0):0),0)
    const d1=d.reduce((a,r)=>a+(isBR(r.testing_pic_1,m.name)?(r.test1_done_2026||0):0),0)
    const d2=d.reduce((a,r)=>a+(isBR(r.testing_pic_2,m.name)?(r.test2_done_2026||0):0),0)
    const d3=d.reduce((a,r)=>a+(isBR(r.testing_pic_3,m.name)?(r.test3_done_2026||0):0),0)
    const closed = t.filter(r=>(r.status_ticket||"").toLowerCase().includes("close")).length
    return { name:m.name, totalDok:d.length, doneDok:done, pilotCount:pilot,
      bobotTesting:Math.round(b1+b2+b3), bobotDone:Math.round(d1+d2+d3),
      totalTicket:t.length, closedTicket:closed }
  })), [brC,brL])

  const myGrade = (name:string) => grades.find(g=>g.name===name)

  const srcC = useMemo(()=>[...(active?mC(active):brC)].sort((a,b)=>(b.year_request||0)-(a.year_request||0)),[brC,active])
  const filtC = useMemo(()=>{
    let d=srcC
    if(docS){const q=docS.toLowerCase(); d=d.filter(r=>(r.doc_name||"").toLowerCase().includes(q)||(r.doc_no||"").toLowerCase().includes(q)||(r.application||"").toLowerCase().includes(q)||(r.br_pic||"").toLowerCase().includes(q))}
    if(docF.status_dev)  d=d.filter(r=>(r.status_dev||"").toUpperCase()===docF.status_dev.toUpperCase())
    if(docF.application) d=d.filter(r=>r.application===docF.application)
    if(docF.quartal)     d=d.filter(r=>r.quartal===docF.quartal)
    return d
  },[srcC,docS,docF])

  const appOpts = useMemo(()=>[...new Set(srcC.map(r=>r.application).filter(Boolean))].sort(),[srcC])
  const qOpts   = useMemo(()=>[...new Set(srcC.map(r=>r.quartal).filter(Boolean))].sort(),[srcC])

  const srcL = useMemo(()=>active?mL(active):brL,[brL,active])
  const filtL = useMemo(()=>{
    let d=srcL
    if(tikS){const q=tikS.toLowerCase(); d=d.filter(r=>(r.nomor_ticket||"").toLowerCase().includes(q)||(r.judul_ticket||"").toLowerCase().includes(q)||(r.aplikasi||"").toLowerCase().includes(q)||(r.br_pic||"").toLowerCase().includes(q))}
    if(tikF.severity) d=d.filter(r=>r.severity===tikF.severity)
    if(tikF.aplikasi) d=d.filter(r=>r.aplikasi===tikF.aplikasi)
    if(tikF.status) d=d.filter(r=>tikF.status==="close"?(r.status_ticket||"").toLowerCase().includes("close"):!(r.status_ticket||"").toLowerCase().includes("close"))
    return d
  },[srcL,tikS,tikF])

  const lAppOpts = useMemo(()=>[...new Set(srcL.map(r=>r.aplikasi).filter(Boolean))].sort(),[srcL])

  const docPages=Math.max(1,Math.ceil(filtC.length/PAGE))
  const pgData=filtC.slice((page-1)*PAGE,page*PAGE)

  const appStats = useMemo(()=>Object.entries((active?mC(active):brC).reduce((acc,r)=>{
    const app=r.application||"Unknown"; if(!acc[app]) acc[app]={total:0,pilot:0,release:0,dev:0,done:0}
    acc[app].total++; const st=(r.status_dev||"").toUpperCase()
    if(st==="PILOT") acc[app].pilot++; if(["RELEASE","DONE"].includes(st)) acc[app].release++
    if(st==="DEV") acc[app].dev++; if(["PILOT","RELEASE","DONE"].includes(st)) acc[app].done++
    return acc
  },{}as Record<string,{total:number;pilot:number;release:number;dev:number;done:number}>))
  .map(([app,v])=>({app,...v,doneRate:pct(v.done,v.total)})).sort((a,b)=>b.total-a.total),[brC,active])

  const svc = useMemo(()=>{
    const src=active?mL(active):brL
    const bySev=Object.entries(src.reduce((acc,r)=>{const s=r.severity||"?"; if(!acc[s]) acc[s]={total:0,closed:0,totalR:0}; acc[s].total++; if((r.status_ticket||"").toLowerCase().includes("close")) acc[s].closed++; acc[s].totalR+=r.br_respon_time_in_s||0; return acc},{}as Record<string,{total:number;closed:number;totalR:number}>)).map(([name,v])=>({name,...v,avgR:v.total>0?Math.round(v.totalR/v.total):0})).sort((a,b)=>b.total-a.total)
    const byMth=Object.entries(src.reduce((acc,r)=>{const m=r.ticket_created_month||"?"; if(!acc[m]) acc[m]={total:0,closed:0}; acc[m].total++; if((r.status_ticket||"").toLowerCase().includes("close")) acc[m].closed++; return acc},{}as Record<string,{total:number;closed:number}>)).map(([month,v])=>({month,...v})).slice(-8)
    const byApp=Object.entries(src.reduce((acc,r)=>{acc[r.aplikasi||"?"]=(acc[r.aplikasi||"?"]||0)+1; return acc},{}as Record<string,number>)).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,8)
    const wSla=src.filter(r=>r.br_respon_time_in_s>0)
    return { bySev, byMth, byApp, total:src.length, closed:src.filter(r=>(r.status_ticket||"").toLowerCase().includes("close")).length, avgR:wSla.length>0?Math.round(wSla.reduce((a,r)=>a+r.br_respon_time_in_s,0)/wSla.length):0 }
  },[brL,active])

  const stab = useMemo(()=>{
    const src=active?mC(active):brC
    const pilot=src.filter(r=>(r.pilot||"").trim()!=="")
    const bySt=Object.entries(src.reduce((acc,r)=>{acc[r.status_dev||"?"]=(acc[r.status_dev||"?"]||0)+1; return acc},{}as Record<string,number>)).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)
    const byQ=Object.entries(src.reduce((acc,r)=>{if(r.quartal) acc[r.quartal]=(acc[r.quartal]||0)+1; return acc},{}as Record<string,number>)).map(([q,v])=>({q,v})).sort((a,b)=>a.q.localeCompare(b.q))
    const mBobot=BR_MEMBERS.map(m=>{const d=mC(m.name); const b1=d.reduce((a,r)=>a+(isBR(r.testing_pic_1,m.name)?(r.bobot_test1_2026||0):0),0),b2=d.reduce((a,r)=>a+(isBR(r.testing_pic_2,m.name)?(r.bobot_test2_2026||0):0),0),b3=d.reduce((a,r)=>a+(isBR(r.testing_pic_3,m.name)?(r.bobot_test3_2026||0):0),0),d1=d.reduce((a,r)=>a+(isBR(r.testing_pic_1,m.name)?(r.test1_done_2026||0):0),0),d2=d.reduce((a,r)=>a+(isBR(r.testing_pic_2,m.name)?(r.test2_done_2026||0):0),0),d3=d.reduce((a,r)=>a+(isBR(r.testing_pic_3,m.name)?(r.test3_done_2026||0):0),0); const tot=b1+b2+b3,don=d1+d2+d3; return {name:m.name,color:m.color,total:Math.round(tot),done:Math.round(don),pct:pct(don,tot)}})
    const filtPilot=pilot.filter(r=>{const q=stS.toLowerCase(); if(!q) return true; return (r.doc_name||"").toLowerCase().includes(q)||(r.application||"").toLowerCase().includes(q)||(r.br_pic||"").toLowerCase().includes(q)})
    return { pilot, bySt, byQ, mBobot, total:src.length, filtPilot }
  },[brC,active,stS])

  const acc = active?mClr(active):"#6366f1"

  if(loading) return <div className="flex flex-col items-center justify-center h-64 gap-4"><div className="relative w-14 h-14"><div className="absolute inset-0 rounded-full border-4 border-indigo-100"/><div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"/></div><p className="text-sm text-gray-400 animate-pulse">Memuat data BR...</p></div>

  return (
    <div className="space-y-5 pb-10">
      <CodaModal  row={selCoda}  onClose={()=>setSelCoda(null)}/>
      <LogixModal row={selLogix} onClose={()=>setSelLogix(null)}/>
      <UnifiedMemberModal
        member={selMember}
        docs={selMember ? mC(selMember.name) : []}
        tickets={selMember ? mL(selMember.name) : []}
        grade={selMember ? (grades.find(g=>g.name===selMember.name)||null) : null}
        onClose={()=>setSelMember(null)}/>

      {/* Hero Banner — clean, no overlay */}
      <div className="rounded-2xl overflow-hidden">
        <img src="/images/Banner.svg" alt="ODSS Banner" className="w-full" style={{ display:"block" }}/>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-white border rounded-2xl p-1.5 gap-1">
          {([{key:"home",l:"🏠 Home"},{key:"application",l:"📦 Application"},{key:"service",l:"🎫 Service Level"},{key:"stability",l:"🧪 Stability"}] as const).map(t=>(
            <button key={t.key} onClick={()=>{setTab(t.key);setPage(1)}}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab===t.key?"text-white shadow-sm":"text-gray-500 hover:bg-gray-50"}`}
              style={tab===t.key?{backgroundColor:acc}:{}}>{t.l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {active && <button onClick={()=>setActive(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100">✕ Reset</button>}
          {BR_MEMBERS.map(m=>(
            <button key={m.name} onClick={()=>setActive(active===m.name?null:m.name)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 transition-all ${active===m.name?"scale-105 shadow-lg":"border-transparent hover:border-gray-200"}`}
              style={active===m.name?{borderColor:m.color,backgroundColor:`${m.color}15`}:{}}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${active===m.name?"":"bg-gray-100"}`} style={active===m.name?{backgroundColor:m.color}:{}}>{m.emoji}</div>
              <span className="text-xs font-bold" style={{ color:active===m.name?m.color:"#9ca3af" }}>{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {active && <div className="flex items-center gap-2 px-4 py-2 rounded-xl w-fit text-sm font-semibold text-white" style={{ backgroundColor:acc }}><span>{BR_MEMBERS.find(m=>m.name===active)?.emoji}</span><span>Menampilkan: {active}</span></div>}

      {/* ══ HOME ══════════════════════════════ */}
      {tab==="home" && (
        <div className="space-y-5">
          <div className="grid grid-cols-5 gap-4">
            {stats.map(m=>(
              <div key={m.name} className={`rounded-2xl p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${active===m.name?"shadow-lg scale-[1.02]":""}`}
                style={{ borderColor:active===m.name?m.color:"transparent",backgroundColor:`${m.color}08` }}
                onClick={()=>setActive(active===m.name?null:m.name)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor:m.color }}>{m.emoji}</div>
                    <div><p className="text-sm font-black text-gray-800">{m.name}</p><p className="text-xs" style={{ color:m.color }}>{m.doneRate}% done</p></div>
                  </div>

                </div>
                {/* Top apps for this member */}
                {(() => {
                  const memberDocs = brC.filter(r => matchC(r, m.name))
                  const topApps = Object.entries(
                    memberDocs.reduce((acc,r) => { acc[r.application||"?"]=(acc[r.application||"?"]||0)+1; return acc }, {}as Record<string,number>)
                  ).sort((a,b)=>b[1]-a[1]).slice(0,3)
                  const doneCount = memberDocs.filter(r=>["PILOT","RELEASE","DONE"].includes((r.status_dev||"").toUpperCase())).length
                  return (
                    <>
                      <div className="space-y-1.5 mb-2.5">
                        {topApps.length > 0 ? topApps.map(([app, count], i) => (
                          <div key={app} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor:CHART_COLORS[i%CHART_COLORS.length] }}/>
                            <span className="text-xs text-gray-600 flex-1 truncate">{app}</span>
                            <span className="text-xs font-bold" style={{ color:m.color }}>{count}</span>
                          </div>
                        )) : <p className="text-xs text-gray-400 italic">Belum ada dokumen</p>}
                      </div>
                      <div className="pt-2 border-t border-dashed flex justify-between items-center">
                        <div className="text-center">
                          <p className="text-base font-black text-gray-800">{memberDocs.length}</p>
                          <p className="text-xs text-gray-400">Total Dok</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black" style={{ color:m.color }}>{doneCount}</p>
                          <p className="text-xs text-gray-400">Done</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black text-emerald-600">{m.tickets}</p>
                          <p className="text-xs text-gray-400">Tiket</p>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-right">💡 Klik card untuk filter per anggota · Klik nama di Leaderboard untuk detail</p>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-4">🏆 Ranking Dokumen per Anggota</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats}><CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/><XAxis dataKey="name" tick={{ fontSize:11 }}/><YAxis/><Tooltip/><Legend/>
                  <Bar dataKey="docs"  name="Total" radius={[4,4,0,0]}>{stats.map(m=><Cell key={m.name} fill={`${m.color}40`}/>)}</Bar>
                  <Bar dataKey="done"  name="Done"  radius={[4,4,0,0]}>{stats.map(m=><Cell key={m.name} fill={m.color}/>)}</Bar>
                  <Bar dataKey="pilot" name="Pilot" radius={[4,4,0,0]}>{stats.map(m=><Cell key={m.name} fill={`${m.color}80`}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-4">🎫 Tiket per Anggota</h3>
              <div className="space-y-3">
                {[...stats].sort((a,b)=>b.tickets-a.tickets).map(m=>(
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor:`${m.color}20` }}>{m.emoji}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-gray-700">{m.name}</span><span className="text-gray-400">{sToHms(m.avgR)} avg</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-5"><div className="h-5 rounded-full flex items-center px-2" style={{ width:`${pct(m.tickets,Math.max(...stats.map(x=>x.tickets))||1)*0.95+5}%`,backgroundColor:m.color }}><span className="text-white text-xs font-bold">{m.tickets}</span></div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


            {/* ── Grade Card + Leaderboard ── */}
          <div className="grid grid-cols-3 gap-5">
            {/* My Grade Card */}
            {active && (() => {
              const g = myGrade(active)
              if (!g) return null
              const cfg = GRADE_CONFIG[g.grade]
              return (
                <div className={`rounded-2xl p-5 text-white bg-gradient-to-br ${cfg.bg} shadow-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Grade {active}</p>
                    <span className="text-2xl">{cfg.emoji}</span>
                  </div>
                  <div className="text-7xl font-black mb-1 leading-none">{g.grade}</div>
                  <p className="text-sm font-semibold opacity-90 mb-3">{cfg.text}</p>
                  <p className="text-xs opacity-70 mb-4">{GRADE_CONFIG[g.grade].msg}</p>
                  <div className="bg-white/20 rounded-xl p-3 space-y-2">
                    {[
                      { l:"Done Rate",    v:Math.round(g.scoreDoneRate),  unit:"%" },
                      { l:"Bobot Test",   v:Math.round(g.scoreBobot),     unit:"%" },
                      { l:"Pilot",        v:Math.round(g.scorePilot),     unit:"pt" },
                      { l:"Ticket Close", v:Math.round(g.scoreTicketClose),unit:"%" },
                      { l:"Volume Dok",   v:Math.round(g.scoreTotalDok),  unit:"pt" },
                    ].map(s => (
                      <div key={s.l} className="flex items-center gap-2">
                        <span className="text-xs opacity-70 w-24">{s.l}</span>
                        <div className="flex-1 bg-white/20 rounded-full h-2">
                          <div className="h-2 rounded-full bg-white" style={{ width:`${s.v}%` }}/>
                        </div>
                        <span className="text-xs font-bold w-10 text-right">{s.v}{s.unit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs opacity-70">Rank </span>
                    <span className="text-lg font-black">#{g.rank}</span>
                    <span className="text-xs opacity-70"> dari {grades.length}</span>
                  </div>
                </div>
              )
            })()}

            {/* Leaderboard */}
            <div className={active ? "col-span-2" : "col-span-3"}>
              <div className="bg-white rounded-2xl border p-5 h-full">
                <h3 className="font-bold text-gray-800 mb-4">🏆 Leaderboard BR</h3>
                <div className="space-y-3">
                  {grades.sort((a,b)=>a.rank-b.rank).map((g,i) => {
                    const cfg = GRADE_CONFIG[g.grade]
                    const member = BR_MEMBERS.find(m=>m.name===g.name)!
                    return (
                      <div key={g.name}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${active===g.name?"ring-2 ring-offset-1":"hover:bg-gray-50"}`}
                        style={active===g.name ? { outline:`2px solid ${member.color}`, outlineOffset:"2px" } : {}}
                        onClick={()=>setSelMember(member)}>
                        {/* Rank badge */}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                          style={{ backgroundColor: i===0?"#fbbf24":i===1?"#d1d5db":i===2?"#f97316":"#f3f4f6", color:i<3?"white":"#6b7280" }}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                        </div>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor:member.color }}>
                          {member.emoji}
                        </div>
                        {/* Name + grade label */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-800">{g.name}</p>
                          <p className="text-xs text-gray-400">Grade {g.grade} · Score {g.totalScore}</p>
                        </div>
                        {/* Progress bar */}
                        <div className="flex-1 hidden sm:block">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width:`${g.totalScore}%`, backgroundColor:cfg.color }}/>
                          </div>
                        </div>
                        {/* Grade badge */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black text-white bg-gradient-to-br ${cfg.bg} shrink-0 shadow-sm`}>
                          {g.grade}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-3 flex-wrap">
                    {(Object.entries(GRADE_CONFIG) as [string, typeof GRADE_CONFIG["A"]][]).map(([g, cfg]) => (
                      <div key={g} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-md" style={{ backgroundColor:cfg.color }}/>
                        <span className="text-xs text-gray-500">Grade {g} ≥ {cfg.min}pt</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">💡 Klik nama untuk detail scorecard</p>
                </div>
              </div>
            </div>
          </div>
      </div>
      )}

      {/* ══ APPLICATION ══════════════════════ */}
      {tab==="application" && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[{l:"Total Dokumen",v:filtC.length,c:"#6366f1"},{l:"Pilot",v:filtC.filter(r=>(r.pilot||"").trim()!=="").length,c:"#3b82f6"},{l:"Release/Done",v:filtC.filter(r=>["RELEASE","DONE"].includes((r.status_dev||"").toUpperCase())).length,c:"#10b981"},{l:"In Dev",v:filtC.filter(r=>(r.status_dev||"").toUpperCase()==="DEV").length,c:"#f59e0b"}].map(s=>(
              <div key={s.l} className="bg-white rounded-2xl border p-4 flex justify-between items-center"><div><p className="text-xs text-gray-400 mb-1">{s.l}</p><p className="text-2xl font-black" style={{ color:s.c }}>{s.v}</p></div></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-3">Dokumen per Aplikasi (Top 10)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={appStats.slice(0,10)} layout="vertical" margin={{ left:10,right:30 }}>
                  <XAxis type="number" tick={{ fontSize:10 }}/><YAxis type="category" dataKey="app" tick={{ fontSize:10 }} width={80}/><Tooltip/>
                  <Bar dataKey="total" name="Total" radius={[0,4,4,0]}>{appStats.slice(0,10).map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Bar>
                  <Bar dataKey="pilot" name="Pilot" radius={[0,4,4,0]} fill="#3b82f6" fillOpacity={0.7}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-3">Status Development</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={Object.entries(srcC.reduce((acc,r)=>{ const s=r.status_dev||"Unknown"; acc[s]=(acc[s]||0)+1; return acc },{}as Record<string,number>)).map(([name,value])=>({name,value}))} dataKey="value" nameKey="name" cx="45%" cy="50%" outerRadius={90} innerRadius={45}>
                    {Object.keys(srcC.reduce((acc,r)=>{ acc[r.status_dev||"Unknown"]=(acc[r.status_dev||"Unknown"]||0)+1; return acc },{}as Record<string,number>)).map((s,i)=><Cell key={s} fill={SDC[s.toUpperCase()]||CHART_COLORS[i%CHART_COLORS.length]}/>)}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(v:string)=><span className="text-xs">{v}</span>}/><Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-gray-800 mb-3">Daftar Dokumen <span className="text-sm text-gray-400 font-normal">({filtC.length})</span></h3>
            <SearchBar search={docS} onSearch={v=>{setDocS(v);setPage(1)}} filters={docF} onFilter={(k:string,v:string)=>{setDocF(f=>({...f,[k]:v}));setPage(1)}}
              filterOpts={[{key:"status_dev",label:"Status Dev",options:["","OPEN","DEV","REVIEW","PILOT","RELEASE","DONE","CANCEL","HOLD"]},{key:"application",label:"Aplikasi",options:["", ...appOpts]},{key:"quartal",label:"Quartal",options:["", ...qOpts]}]}/>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead><tr style={{ background:"linear-gradient(90deg,#0f172a,#1e1b4b)" }} className="text-white">{["Doc No","Doc Name","App","BR PIC","Testing PIC","Status","Pilot","Q","Year"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {pgData.map((r,i)=>(
                    <tr key={r.id||i} className={`border-t cursor-pointer ${i%2===0?"bg-white":"bg-slate-50/40"} hover:bg-indigo-50/50`} onClick={()=>setSelCoda(r)}>
                      <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.doc_no||"—"}</td>
                      <td className="px-3 py-2.5 text-xs max-w-[180px]"><p className="font-medium text-gray-800 truncate">{r.doc_name||"—"}</p><p className="text-gray-400 text-xs truncate">{(r.description||"").substring(0,50)}</p></td>
                      <td className="px-3 py-2.5 text-xs"><span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{r.application||"—"}</span></td>
                      <td className="px-3 py-2.5 text-xs font-semibold" style={{ color:mClr(BR_NAMES.find(n=>isBR(r.br_pic,n))||"") }}>{r.br_pic||"—"}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[120px] truncate">{[r.testing_pic_1,r.testing_pic_2,r.testing_pic_3].filter(Boolean).join(", ")||"—"}</td>
                      <td className="px-3 py-2.5"><SBadge s={r.status_dev}/></td>
                      <td className="px-3 py-2.5 text-center">{r.pilot?<span className="text-blue-600">✈️</span>:<span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{r.quartal||"—"}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{r.year_request||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {docPages>1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">Hal. {page}/{docPages} · {filtC.length} dok</p>
                <div className="flex gap-1.5">
                  <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">←</button>
                  {Array.from({length:Math.min(5,docPages)},(_,idx)=>{ let p=idx+1; if(docPages>5&&page>3) p=page-2+idx; if(p>docPages||p<1) return null; return <button key={p} onClick={()=>setPage(p)} className={`px-3 py-1.5 rounded-lg border text-xs ${p===page?"text-white":"hover:bg-gray-50"}`} style={p===page?{backgroundColor:acc}:{}}>{p}</button> })}
                  <button disabled={page===docPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">→</button>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2 text-center">💡 Klik baris untuk detail lengkap dokumen</p>
          </div>
        </div>
      )}

      {/* ══ SERVICE LEVEL ════════════════════ */}
      {tab==="service" && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[{l:"Total Tiket",v:svc.total},{l:"Closed",v:svc.closed},{l:"Avg Respon",v:sToHms(svc.avgR)},{l:"Hasil Filter",v:filtL.length}].map(s=>(
              <div key={s.l} className="bg-white rounded-2xl border p-4 flex justify-between items-center"><div><p className="text-xs text-gray-400 mb-1">{s.l}</p><p className="text-2xl font-black text-gray-800">{s.v}</p></div></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-4">Tiket per Severity</h3>
              <div className="space-y-3">{svc.bySev.map(s=>(
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-xs"><SevBadge s={s.name}/><span className="text-gray-500">{s.total} · {sToHms(s.avgR)}</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-3"><div className="h-3 rounded-full" style={{ width:`${pct(s.total,svc.total)}%`,backgroundColor:SVC[s.name]||"#6b7280" }}/></div>
                </div>
              ))}</div>
            </div>
            <div className="col-span-2 bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-3">Tren Tiket per Bulan</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={svc.byMth}>
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/><XAxis dataKey="month" tick={{ fontSize:10 }}/><YAxis/><Tooltip/><Legend/>
                  <Area type="monotone" dataKey="total"  name="Total"  stroke="#6366f1" fill="url(#g1)"  strokeWidth={2}/>
                  <Area type="monotone" dataKey="closed" name="Closed" stroke="#10b981" fill="url(#g2)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-gray-800 mb-3">Detail Tiket <span className="text-sm text-gray-400 font-normal">({filtL.length})</span></h3>
            <SearchBar search={tikS} onSearch={setTikS} filters={tikF} onFilter={(k:string,v:string)=>setTikF(f=>({...f,[k]:v}))}
              filterOpts={[{key:"severity",label:"Severity",options:["","Critical","High","Medium","Low"]},{key:"aplikasi",label:"Aplikasi",options:["", ...lAppOpts]},{key:"status",label:"Status",options:["","close","open"]}]}/>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead><tr style={{ background:"linear-gradient(90deg,#1e3a5f,#2563eb)" }} className="text-white">{["No Tiket","Judul","BR PIC","Aplikasi","Severity","Status","Respon BR","Durasi","Bulan"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {filtL.slice(0,50).map((r,i)=>(
                    <tr key={r.id||i} className={`border-t cursor-pointer ${i%2===0?"bg-white":"bg-blue-50/20"} hover:bg-blue-50/60`} onClick={()=>setSelLogix(r)}>
                      <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.nomor_ticket||"—"}</td>
                      <td className="px-3 py-2.5 text-xs max-w-[200px] truncate font-medium text-gray-700">{r.judul_ticket||r.detail_issue||"—"}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold" style={{ color:mClr(BR_NAMES.find(n=>isBR(r.br_pic,n))||"") }}>{r.br_pic||"—"}</td>
                      <td className="px-3 py-2.5 text-xs"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{r.aplikasi||"—"}</span></td>
                      <td className="px-3 py-2.5"><SevBadge s={r.severity}/></td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(r.status_ticket||"").toLowerCase().includes("close")?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{r.status_ticket||"—"}</span></td>
                      <td className="px-3 py-2.5 text-xs font-mono text-gray-600">{r.br_respon_time||"—"}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{r.ticket_durasi||"—"}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-400">{r.ticket_created_month||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">💡 Klik baris untuk detail tiket</p>
          </div>
        </div>
      )}

      {/* ══ STABILITY ════════════════════════ */}
      {tab==="stability" && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[{l:"Total Dok",v:stab.total},{l:"Sudah Pilot",v:stab.pilot.length},{l:"Belum Pilot",v:stab.total-stab.pilot.length},{l:"Pilot Rate",v:`${pct(stab.pilot.length,stab.total)}%`}].map(s=>(
              <div key={s.l} className="bg-white rounded-2xl border p-4 flex justify-between items-center"><div><p className="text-xs text-gray-400 mb-1">{s.l}</p><p className="text-2xl font-black text-gray-800">{s.v}</p></div></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-3">Status Development</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stab.bySt}><CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/><XAxis dataKey="name" tick={{ fontSize:10 }} angle={-15} textAnchor="end" height={50}/><YAxis/><Tooltip/>
                  <Bar dataKey="value" name="Dok" radius={[6,6,0,0]}>{stab.bySt.map(s=><Cell key={s.name} fill={SDC[(s.name||"").toUpperCase()]||"#6b7280"}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-bold text-gray-800 mb-3">Distribusi per Quartal</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stab.byQ}><CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/><XAxis dataKey="q" tick={{ fontSize:10 }}/><YAxis/><Tooltip/>
                  <Bar dataKey="v" name="Dok" radius={[6,6,0,0]}>{stab.byQ.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-gray-800 mb-4">⚖️ Bobot Testing 2026 per Anggota</h3>
            <div className="grid grid-cols-5 gap-4">
              {stab.mBobot.map(m=>(
                <div key={m.name} className="rounded-2xl p-4 text-center border" style={{ borderColor:`${m.color}40`,backgroundColor:`${m.color}08` }}>
                  <div className="text-2xl font-black mb-1" style={{ color:m.color }}>{m.done}</div>
                  <div className="text-xs text-gray-500 mb-1">/ {m.total}</div>
                  <div className="font-bold text-sm text-gray-700 mb-2">{m.name}</div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{ width:`${m.pct}%`,backgroundColor:m.color }}/></div>
                  <div className="text-xs mt-1 font-bold" style={{ color:m.color }}>{m.pct}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-bold text-gray-800 mb-3">Dokumen Pilot <span className="text-sm text-gray-400 font-normal">({stab.filtPilot.length})</span></h3>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span><input value={stS} onChange={e=>setStS(e.target.value)} placeholder="Cari nama, aplikasi, BR PIC..." className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-violet-400"/></div>
              {stS && <button onClick={()=>setStS("")} className="px-3 py-2 rounded-xl border text-xs text-gray-500 hover:bg-gray-50">✕</button>}
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead><tr style={{ background:"linear-gradient(90deg,#4c1d95,#6d28d9)" }} className="text-white">{["Doc No","Doc Name","App","BR PIC","Testing PIC 1","Testing PIC 2","Status","Pilot","Quartal"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {stab.filtPilot.slice(0,50).map((r,i)=>(
                    <tr key={r.id||i} className={`border-t cursor-pointer ${i%2===0?"bg-white":"bg-purple-50/20"} hover:bg-purple-50/50`} onClick={()=>setSelCoda(r)}>
                      <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{r.doc_no||"—"}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-800 max-w-[180px] truncate">{r.doc_name||"—"}</td>
                      <td className="px-3 py-2.5 text-xs"><span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{r.application||"—"}</span></td>
                      <td className="px-3 py-2.5 text-xs font-semibold" style={{ color:mClr(BR_NAMES.find(n=>isBR(r.br_pic,n))||"") }}>{r.br_pic||"—"}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">{r.testing_pic_1||"—"}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">{r.testing_pic_2||"—"}</td>
                      <td className="px-3 py-2.5"><SBadge s={r.status_dev}/></td>
                      <td className="px-3 py-2.5 text-xs text-blue-600 font-medium">{r.pilot||"—"}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{r.quartal||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">💡 Klik baris untuk detail dokumen</p>
          </div>
        </div>
      )}
    </div>
  )
}