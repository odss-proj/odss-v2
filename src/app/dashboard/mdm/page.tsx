"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardMdm from "../../../components/dashboard/DashboardMdm"

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://kuncariadi.app.n8n.cloud/webhook/get-mdm-sheets"

type n8nUserMetrics = {
  totalSetting: number
  totalRelease: number
  slSettingPoints: number
  slSettingCount: number
  accuracyOkCount: number
  totalRows: number
}

type n8nUserKPI = {
  serviceLevel: string
  accuracy: string
  finalScore: string
}

type n8nUserData = {
  metrics: n8nUserMetrics
  kpi: n8nUserKPI
  charts: {
    daily: Record<string, {
      qty: number
      weight: number
      okCount: number
      notOkCount: number
      slPoints: number
      slCount: number
    }>
  }
}

type n8nResponse = {
  leaderboard: { name: string; score: number }[]
  userData: Record<string, n8nUserData>
}

export default function MDMPage() {
  const router = useRouter()
  const [n8nData, setn8nData] = useState<n8nResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cek role user
  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()
      if (!role) return
      if (role !== "MDM") {
        if (role === "APPC") router.push("/dashboard/appc")
        if (role === "APPT") router.push("/dashboard/appt")
      }
    }
    checkRole()
  }, [])

  useEffect(() => {
    const fetchn8nData = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(N8N_WEBHOOK_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          // Refresh otomatis setiap request (no cache)
          cache: "no-store",
        })

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

        const json: n8nResponse = await res.json()
        const parsed = Array.isArray(json) ? json[0] : json
        setn8nData(parsed)
      } catch (err) {
        console.error("Gagal fetch data dari n8n:", err)
        setError("Gagal mengambil data dari n8n. Periksa URL webhook Anda.")
      } finally {
        setLoading(false)
      }
    }

    fetchn8nData()

    // Auto-refresh setiap 5 menit
    const interval = setInterval(fetchn8nData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Agregat semua user MDM untuk summary KPI
  const aggregated = n8nData?.userData
    ? Object.values(n8nData.userData).reduce(
        (acc, user) => {
          acc.totalSetting += user.metrics.totalSetting
          acc.totalRelease += user.metrics.totalRelease
          acc.slPoints += user.metrics.slSettingPoints
          acc.slCount += user.metrics.slSettingCount
          acc.accOk += user.metrics.accuracyOkCount
          acc.totalRows += user.metrics.totalRows
          return acc
        },
        { totalSetting: 0, totalRelease: 0, slPoints: 0, slCount: 0, accOk: 0, totalRows: 0 }
      )
    : null

  const serviceLevel = aggregated && aggregated.slCount > 0
    ? (aggregated.slPoints / aggregated.slCount).toFixed(1) + "%"
    : "-"

  const akurasi = aggregated && aggregated.totalRows > 0
    ? (aggregated.accOk / aggregated.totalRows * 100).toFixed(1) + "%"
    : "-"

  // Bangun chart data dari daily activity semua user
  const chartData = n8nData?.userData
    ? (() => {
        const dailyMap: Record<string, { qty: number; okCount: number }> = {}
        Object.values(n8nData.userData).forEach(user => {
          Object.entries(user.charts.daily).forEach(([date, day]) => {
            if (!dailyMap[date]) dailyMap[date] = { qty: 0, okCount: 0 }
            dailyMap[date].qty += day.qty
            dailyMap[date].okCount += day.okCount
          })
        })
        return Object.entries(dailyMap)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .slice(-7) // tampilkan 7 hari terakhir
          .map(([date, val]) => ({
            name: new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
            Setting: val.qty,
            Akurasi: val.okCount,
          }))
      })()
    : []

  const config = {
    name: "MDM",
    kpi: [
      {
        title: "Total Setting",
        value: aggregated ? String(aggregated.totalSetting) : "-",
        icon: "✅",
        color: "bg-green-100",
      },
      {
        title: "Total Release",
        value: aggregated ? String(aggregated.totalRelease) : "-",
        icon: "🚀",
        color: "bg-blue-100",
      },
      {
        title: "Service Level",
        value: serviceLevel,
        icon: "📈",
        color: "bg-yellow-100",
      },
      {
        title: "Akurasi Setting",
        value: akurasi,
        icon: "🎯",
        color: "bg-purple-100",
      },
    ],
    leaderboard: n8nData?.leaderboard ?? [],
    chartData,
  }

    // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Memuat data dari n8n...</p>
      </div>
    )
  }

    // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm text-red-500 font-medium">{error}</p>
        <p className="text-xs text-gray-400">
          Pastikan <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_N8N_WEBHOOK_URL</code> sudah diset di <code className="bg-gray-100 px-1 rounded">.env.local</code>
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return <DashboardMdm config={config} />
}