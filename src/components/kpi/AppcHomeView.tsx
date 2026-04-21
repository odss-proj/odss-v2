"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

const APPS_TEAM = ["FAJRUL", "ASWAN", "IHSAN", "BRELY", "TAUFIK", "ACHMAD", "AANG"]
const EXCLUDED_TAS = ["ALIF", "REVINDA", "ANAS", "GALIH", "ALDI", "YOSHI", "FAJAR", "HERMANTO", "IRSYAD", "ASEP"]

function extractFirstName(val: string): string {
  if (!val || val === "null") return ""
  return val.split(",")[0].trim().toUpperCase().split(" ")[0]
}

type SummaryData = {
  dt: { overall: number; latestWeek: number; latestWeekNum: number; lowCount: number; totalSubdist: number } | null
  oc: { h3: number; h7: number; latestWeek: number; lowCount: number } | null
  wf: { overall: number; latestPekan: number; avgLama: number; lowCount: number } | null
  coda: { total: number; done: number; progress: number; open: number } | null
  logix: { total: number; solved: number; high: number; avgDurasi: number } | null
  tasScores: { tas: string; dtAch: number; ocH3: number; wfAch: number; logixSolved: number; score: number }[]
}

function pct(v: number) { return (v * 100).toFixed(1) + "%" }
function avg(arr: number[]) { return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

function StatusDot({ value, threshold, invert = false }: { value: number; threshold: number; invert?: boolean }) {
  const good = invert ? value <= threshold : value >= threshold
  return <span className={`inline-block w-2 h-2 rounded-full ${good ? "bg-green-500" : "bg-red-500"}`} />
}

export default function AppcHomeView() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate] = useState(new Date().toLocaleString("id-ID"))

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)

      // Fetch all tables in parallel
      const fetchAllRows = async (table: string) => {
        let all: Record<string, unknown>[] = []
        let from = 0
        while (true) {
          const { data, error } = await supabase.from(table).select("*").range(from, from + 999)
          if (error || !data || data.length === 0) break
          all = [...all, ...data]
          if (data.length < 1000) break
          from += 1000
        }
        return all
      }

      const [dtRows, ocRows, wfRows, codaRows, logixRows] = await Promise.all([
        fetchAllRows("dt_transfer"),
        fetchAllRows("own_cloud"),
        fetchAllRows("monitoring_wf"),
        fetchAllRows("coda_main"),
        fetchAllRows("logix"),
      ])

      // ── DT Transfer ──
      const dtData = dtRows.map((r) => ({
        cover: String(r["cover"] ?? "").toUpperCase(),
        pic: String(r["pic"] ?? "").toUpperCase().trim(),
        week: Number(r["week"] ?? 0),
        ach: Number(r["ach"] ?? 0) > 1 ? Number(r["ach"]) / 100 : Number(r["ach"] ?? 0),
        subdis_id: Number(r["kode_subdist"] ?? 0),
      })).filter((r) => r.cover !== "CNS" && !EXCLUDED_TAS.includes(r.pic))

      const dtLatestWeek = dtData.length > 0 ? Math.max(...dtData.map((r) => r.week)) : 0
      const dtLatest = dtData.filter((r) => r.week === dtLatestWeek)
      const dt = dtData.length > 0 ? {
        overall: avg(dtData.map((r) => r.ach)),
        latestWeek: avg(dtLatest.map((r) => r.ach)),
        latestWeekNum: dtLatestWeek,
        lowCount: dtLatest.filter((r) => r.ach < 0.95).length,
        totalSubdist: new Set(dtData.map((r) => r.subdis_id)).size,
      } : null

      // ── Own Cloud ──
      const ocData = ocRows.map((r) => {
        const h3Raw = Number(r["kel_h3"] ?? 0)
        const h7Raw = Number(r["kel_h7"] ?? 0)
        return {
          area: String(r["area"] ?? "").toUpperCase(),
          tas: String(r["tas"] ?? "").toUpperCase().trim(),
          week: Number(r["week"] ?? 0),
          h3: h3Raw > 1 ? h3Raw / 100 : h3Raw,
          h7: h7Raw > 1 ? h7Raw / 100 : h7Raw,
        }
      }).filter((r) => r.area !== "CNS" && !EXCLUDED_TAS.includes(r.tas))

      const ocLatestWeek = ocData.length > 0 ? Math.max(...ocData.map((r) => r.week)) : 0
      const ocLatest = ocData.filter((r) => r.week === ocLatestWeek)
      const oc = ocData.length > 0 ? {
        h3: avg(ocLatest.map((r) => r.h3)),
        h7: avg(ocLatest.map((r) => r.h7)),
        latestWeek: ocLatestWeek,
        lowCount: ocLatest.filter((r) => r.h3 < 0.90).length,
      } : null

      // ── Monitoring WF ──
      const wfData = wfRows.map((r) => ({
        region: String(r["region"] ?? "").toUpperCase(),
        tas: String(r["tas"] ?? "").toUpperCase().trim(),
        pekan: Number(r["pekan"] ?? 0),
        prosentase: Number(r["prosentase"] ?? 0) > 1 ? Number(r["prosentase"]) / 100 : Number(r["prosentase"] ?? 0),
        lama: Number(r["lama"] ?? 0),
      })).filter((r) => r.region !== "CNS" && !EXCLUDED_TAS.includes(r.tas))

      const wfLatestPekan = wfData.length > 0 ? Math.max(...wfData.map((r) => r.pekan)) : 0
      const wfLatest = wfData.filter((r) => r.pekan === wfLatestPekan)
      const wf = wfData.length > 0 ? {
        overall: avg(wfData.map((r) => r.prosentase)),
        latestPekan: avg(wfLatest.map((r) => r.prosentase)),
        avgLama: avg(wfData.map((r) => r.lama)),
        lowCount: wfLatest.filter((r) => r.prosentase < 0.95).length,
      } : null

      // ── Coda ──
      const codaData = codaRows.map((r) => ({
        pic_name: extractFirstName(String(r["task_pic_2"] ?? "")),
        status_dev: String(r["status_dev"] ?? ""),
        year_request: Number(r["year_request"] ?? 0),
      })).filter((r) => APPS_TEAM.includes(r.pic_name))

      const coda2026 = codaData.filter((r) => r.year_request === 2026)
      const coda = codaData.length > 0 ? {
        total: coda2026.length,
        done: coda2026.filter((r) => ["RELEASE", "DONE"].includes(r.status_dev)).length,
        progress: coda2026.filter((r) => ["PILOT", "OPEN TEST", "DONE DEV", "READY TO PILOT", "OPG DEV", "OPG TEST", "OPEN COMPILE"].includes(r.status_dev)).length,
        open: coda2026.filter((r) => ["OPEN DEV", "OPEN"].includes(r.status_dev)).length,
      } : null

      // ── Logix ──
      const logixData = logixRows.map((r) => ({
        tas_pic: String(r["tas_pic"] ?? "").toUpperCase().trim(),
        status: String(r["status_ticket"] ?? ""),
        severity: String(r["severity"] ?? ""),
        durasi: Number(r["ticket_durasi_in_s"] ?? 0),
      })).filter((r) => APPS_TEAM.includes(r.tas_pic))

      const logix = logixData.length > 0 ? {
        total: logixData.length,
        solved: logixData.filter((r) => r.status === "SOLVED").length,
        high: logixData.filter((r) => r.severity === "HIGH PRIORITY").length,
        avgDurasi: avg(logixData.filter((r) => r.durasi > 0).map((r) => r.durasi)) / 3600,
      } : null

      // ── TAS Leaderboard ──
      const tasScores = APPS_TEAM.map((tas) => {
        const dtTas = dtData.filter((r) => r.pic === tas)
        const ocTas = ocData.filter((r) => r.tas === tas)
        const wfTas = wfData.filter((r) => r.tas === tas)
        const logixTas = logixData.filter((r) => r.tas_pic === tas)

        const dtAch = dtTas.length > 0 ? avg(dtTas.map((r) => r.ach)) : 0
        const ocH3 = ocTas.length > 0 ? avg(ocTas.map((r) => r.h3)) : 0
        const wfAch = wfTas.length > 0 ? avg(wfTas.map((r) => r.prosentase)) : 0
        const logixSolved = logixTas.length > 0 ? logixTas.filter((r) => r.status === "SOLVED").length / logixTas.length : 0

        // Weighted score: DT 35% + OC 25% + WF 25% + Logix 15%
        const score = (dtAch * 0.35 + ocH3 * 0.25 + wfAch * 0.25 + logixSolved * 0.15) * 100

        return { tas, dtAch, ocH3, wfAch, logixSolved, score }
      }).filter((t) => t.dtAch > 0 || t.ocH3 > 0 || t.wfAch > 0 || t.logixSolved > 0)
        .sort((a, b) => b.score - a.score)

      setSummary({ dt, oc, wf, coda, logix, tasScores })
      setLoading(false)
    }

    fetchAll()
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Memuat ringkasan dashboard...</p>
      <p className="text-xs text-gray-300">Mengambil data dari 5 sumber sekaligus</p>
    </div>
  )

  if (!summary) return null

  const { dt, oc, wf, coda, logix, tasScores } = summary
  const topTas = tasScores[0]

  return (
    <div className="space-y-6">

      {/* HEADER INFO */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Ringkasan KPI Tim APPC</h2>
          <p className="text-xs text-gray-400 mt-0.5">Data real-time dari semua modul · Update: {lastUpdate}</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600 font-medium">LIVE</span>
        </div>
      </div>

      {/* 5 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-5 gap-3">
        {/* DT Transfer */}
        <div className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">DT Transfer</span>
            <StatusDot value={dt?.latestWeek ?? 0} threshold={0.95} />
          </div>
          <p className={`text-2xl font-bold ${(dt?.latestWeek ?? 0) >= 0.98 ? "text-green-600" : (dt?.latestWeek ?? 0) >= 0.95 ? "text-yellow-600" : "text-red-500"}`}>
            {dt ? pct(dt.latestWeek) : "-"}
          </p>
          <p className="text-xs text-gray-400 mt-1">W{dt?.latestWeekNum} · {dt?.totalSubdist} subdist</p>
          {(dt?.lowCount ?? 0) > 0 && (
            <p className="text-xs text-red-500 mt-1">⚠️ {dt?.lowCount} low performer</p>
          )}
        </div>

        {/* Own Cloud */}
        <div className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Own Cloud</span>
            <StatusDot value={oc?.h3 ?? 0} threshold={0.90} />
          </div>
          <p className={`text-2xl font-bold ${(oc?.h3 ?? 0) >= 0.98 ? "text-green-600" : (oc?.h3 ?? 0) >= 0.90 ? "text-yellow-600" : "text-red-500"}`}>
            {oc ? pct(oc.h3) : "-"}
          </p>
          <p className="text-xs text-gray-400 mt-1">KEL H+3 · W{oc?.latestWeek}</p>
          {(oc?.lowCount ?? 0) > 0 && (
            <p className="text-xs text-red-500 mt-1">⚠️ {oc?.lowCount} low performer</p>
          )}
        </div>

        {/* Monitoring WF */}
        <div className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Monitoring WF</span>
            <StatusDot value={wf?.latestPekan ?? 0} threshold={0.95} />
          </div>
          <p className={`text-2xl font-bold ${(wf?.latestPekan ?? 0) >= 0.98 ? "text-green-600" : (wf?.latestPekan ?? 0) >= 0.95 ? "text-yellow-600" : "text-red-500"}`}>
            {wf ? pct(wf.latestPekan) : "-"}
          </p>
          <p className="text-xs text-gray-400 mt-1">P{wf ? Math.round(wf.latestPekan) : "-"} terkini</p>
          {(wf?.lowCount ?? 0) > 0 && (
            <p className="text-xs text-red-500 mt-1">⚠️ {wf?.lowCount} low performer</p>
          )}
        </div>

        {/* Coda Backlog */}
        <div className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Coda Backlog</span>
            <StatusDot value={(coda?.done ?? 0) / Math.max(coda?.total ?? 1, 1)} threshold={0.5} />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {coda ? `${coda.done}/${coda.total}` : "-"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Release · 2026</p>
          {(coda?.open ?? 0) > 0 && (
            <p className="text-xs text-yellow-600 mt-1">⏳ {coda?.open} open backlog</p>
          )}
        </div>

        {/* Logix */}
        <div className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Logix Tiket</span>
            <StatusDot value={(logix?.solved ?? 0) / Math.max(logix?.total ?? 1, 1)} threshold={0.95} />
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {logix ? `${logix.solved}/${logix.total}` : "-"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Solved · avg {logix?.avgDurasi.toFixed(1)}h</p>
          {(logix?.high ?? 0) > 0 && (
            <p className="text-xs text-red-500 mt-1">🔴 {logix?.high} high priority</p>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-5">

        {/* LEFT — TAS Leaderboard */}
        <div className="space-y-4">

          {/* Top performer card */}
          {topTas && (
            <div className="bg-gradient-to-br from-green-500 to-teal-500 text-white p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <p className="text-xs opacity-80 mb-1">🏆 Top Performer</p>
              <h2 className="text-2xl font-bold">{topTas.tas}</h2>
              <p className="text-sm opacity-90 mt-1">Score: <strong>{topTas.score.toFixed(1)}</strong></p>
              <div className="flex gap-3 mt-3 text-xs opacity-80">
                <span>DT {pct(topTas.dtAch)}</span>
                <span>OC {pct(topTas.ocH3)}</span>
                <span>WF {pct(topTas.wfAch)}</span>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border p-5">
            <h3 className="font-semibold mb-4 text-sm">Leaderboard TAS</h3>
            <div className="space-y-3">
              {tasScores.map((t, i) => (
                <div key={t.tas} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-orange-400 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.tas}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ScoreBar value={t.score} max={100} color={i === 0 ? "#22c55e" : i < 3 ? "#3b82f6" : "#9ca3af"} />
                    </div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${i === 0 ? "text-green-600" : i < 3 ? "text-blue-600" : "text-gray-500"}`}>
                    {t.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-3">*Score: DT 35% + OC 25% + WF 25% + Logix 15%</p>
          </div>
        </div>

        {/* CENTER — KPI Radar per modul */}
        <div className="space-y-4">

          {/* DT Transfer detail */}
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🔄</span>
                <span className="font-semibold text-sm">Data Transfer HO</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(dt?.latestWeek ?? 0) >= 0.98 ? "bg-green-100 text-green-700" : (dt?.latestWeek ?? 0) >= 0.95 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                {dt ? pct(dt.latestWeek) : "-"}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="h-2.5 rounded-full transition-all" style={{ width: `${(dt?.latestWeek ?? 0) * 100}%`, backgroundColor: (dt?.latestWeek ?? 0) >= 0.98 ? "#22c55e" : (dt?.latestWeek ?? 0) >= 0.95 ? "#eab308" : "#ef4444" }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Overall: {dt ? pct(dt.overall) : "-"} · Target: 98%</p>
          </div>

          {/* Own Cloud detail */}
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">☁️</span>
                <span className="font-semibold text-sm">Own Cloud</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(oc?.h3 ?? 0) >= 0.98 ? "bg-green-100 text-green-700" : (oc?.h3 ?? 0) >= 0.90 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                {oc ? pct(oc.h3) : "-"}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
              <div className="h-2.5 rounded-full" style={{ width: `${(oc?.h3 ?? 0) * 100}%`, backgroundColor: (oc?.h3 ?? 0) >= 0.98 ? "#14b8a6" : (oc?.h3 ?? 0) >= 0.90 ? "#eab308" : "#ef4444" }} />
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-teal-300" style={{ width: `${(oc?.h7 ?? 0) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">H+3: {oc ? pct(oc.h3) : "-"} · H+7: {oc ? pct(oc.h7) : "-"}</p>
          </div>

          {/* Monitoring WF detail */}
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <span className="font-semibold text-sm">Monitoring WF</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(wf?.overall ?? 0) >= 0.98 ? "bg-green-100 text-green-700" : (wf?.overall ?? 0) >= 0.95 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                {wf ? pct(wf.overall) : "-"}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="h-2.5 rounded-full" style={{ width: `${(wf?.overall ?? 0) * 100}%`, backgroundColor: (wf?.overall ?? 0) >= 0.98 ? "#6366f1" : (wf?.overall ?? 0) >= 0.95 ? "#eab308" : "#ef4444" }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Avg selisih: {wf ? `${wf.avgLama.toFixed(1)} hari` : "-"} · Target: 98%</p>
          </div>
        </div>

        {/* RIGHT — Coda + Logix summary */}
        <div className="space-y-4">

          {/* Coda Backlog */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">📋</span>
              <span className="font-semibold text-sm">Coda Backlog 2026</span>
            </div>
            {coda ? (
              <>
                {/* Stacked bar */}
                <div className="w-full h-5 rounded-full overflow-hidden flex mb-3">
                  <div className="bg-green-400 h-5" style={{ width: `${(coda.done / coda.total) * 100}%` }} title={`Done: ${coda.done}`} />
                  <div className="bg-blue-400 h-5" style={{ width: `${(coda.progress / coda.total) * 100}%` }} title={`Progress: ${coda.progress}`} />
                  <div className="bg-yellow-400 h-5" style={{ width: `${(coda.open / coda.total) * 100}%` }} title={`Open: ${coda.open}`} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">{coda.done}</p>
                    <p className="text-xs text-gray-400">✅ Done</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{coda.progress}</p>
                    <p className="text-xs text-gray-400">🔵 Progress</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{coda.open}</p>
                    <p className="text-xs text-gray-400">⏳ Open</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Completion rate</span>
                    <span className="font-semibold">{((coda.done / coda.total) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </>
            ) : <p className="text-xs text-gray-400">Belum ada data</p>}
          </div>

          {/* Logix Summary */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">🚚</span>
              <span className="font-semibold text-sm">Logix Tiket</span>
            </div>
            {logix ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{logix.solved}</p>
                    <p className="text-xs text-gray-400">✅ Solved</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-500">{logix.total - logix.solved}</p>
                    <p className="text-xs text-gray-400">⏳ Open</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 border-t pt-3">
                  <span>🔴 High Priority</span>
                  <span className="font-semibold text-red-500">{logix.high} tiket</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>⏱️ Rata-rata selesai</span>
                  <span className="font-semibold">{logix.avgDurasi.toFixed(1)} jam</span>
                </div>
              </>
            ) : <p className="text-xs text-gray-400">Belum ada data</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
