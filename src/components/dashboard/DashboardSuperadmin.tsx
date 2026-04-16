"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import Banner from "../layout/banner"
import { supabase } from "../../lib/supabase"

type TabKey = "dt_transfer" | "own_cloud" | "monitoring_wf" | "coda" | "logix"

type TabConfig = {
  key: TabKey
  label: string
  icon: string
  color: string
  activeColor: string
  description: string
}

const TABS: TabConfig[] = [
  {
    key: "dt_transfer",
    label: "DT Transfer",
    icon: "🔄",
    color: "bg-gray-100 text-gray-600",
    activeColor: "bg-blue-500 text-white",
    description: "Upload data transfer untuk sinkronisasi sistem",
  },
  {
    key: "own_cloud",
    label: "Own Cloud",
    icon: "☁️",
    color: "bg-gray-100 text-gray-600",
    activeColor: "bg-teal-500 text-white",
    description: "Kelola data cloud storage dan sinkronisasi file",
  },
  {
    key: "monitoring_wf",
    label: "Monitoring WF",
    icon: "📊",
    color: "bg-gray-100 text-gray-600",
    activeColor: "bg-green-500 text-white",
    description: "Monitoring workflow dan status pengerjaan",
  },
  {
    key: "coda",
    label: "Coda",
    icon: "📋",
    color: "bg-gray-100 text-gray-600",
    activeColor: "bg-purple-500 text-white",
    description: "Upload dan sinkronisasi data dari Coda",
  },
  {
    key: "logix",
    label: "Logix",
    icon: "🚚",
    color: "bg-gray-100 text-gray-600",
    activeColor: "bg-orange-500 text-white",
    description: "Import data logistik dan pengiriman dari Logix",
  },
]

type UploadState = {
  fileName: string | null
  data: Record<string, unknown>[]
  headers: string[]
  sheetName: string
  rowCount: number
  status: "idle" | "loading" | "success" | "error"
  errorMsg: string
}

const initialUploadState: UploadState = {
  fileName: null,
  data: [],
  headers: [],
  sheetName: "",
  rowCount: 0,
  status: "idle",
  errorMsg: "",
}

export default function DashboardSuperadmin({ userName = "superadmin" }: { userName?: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>("dt_transfer")
  const [uploadStates, setUploadStates] = useState<Record<TabKey, UploadState>>(
    () =>
      Object.fromEntries(TABS.map((t) => [t.key, { ...initialUploadState }])) as Record<
        TabKey,
        UploadState
      >
  )
  const [currentPage, setCurrentPage] = useState<Record<TabKey, number>>(
    () => Object.fromEntries(TABS.map((t) => [t.key, 1])) as Record<TabKey, number>
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ROWS_PER_PAGE = 10

  const currentState = uploadStates[activeTab]
  const currentPage_ = currentPage[activeTab]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadStates((prev) => ({
        ...prev,
        [activeTab]: {
          ...initialUploadState,
          status: "error",
          errorMsg: "Format file tidak valid. Gunakan .xlsx, .xls, atau .csv",
        },
      }))
      return
    }

    setUploadStates((prev) => ({
      ...prev,
      [activeTab]: { ...initialUploadState, status: "loading", fileName: file.name },
    }))

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
        })
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []

        setUploadStates((prev) => ({
          ...prev,
          [activeTab]: {
            fileName: file.name,
            data: jsonData,
            headers,
            sheetName,
            rowCount: jsonData.length,
            status: "success",
            errorMsg: "",
          },
        }))
        setCurrentPage((prev) => ({ ...prev, [activeTab]: 1 }))
      } catch {
        setUploadStates((prev) => ({
          ...prev,
          [activeTab]: {
            ...initialUploadState,
            status: "error",
            fileName: file.name,
            errorMsg: "Gagal membaca file. Pastikan format file valid.",
          },
        }))
      }
    }
    reader.readAsBinaryString(file)

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleReset = () => {
    setUploadStates((prev) => ({
      ...prev,
      [activeTab]: { ...initialUploadState },
    }))
  }

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!

  // Pagination
  const totalPages = Math.max(1, Math.ceil(currentState.data.length / ROWS_PER_PAGE))
  const paginatedData = currentState.data.slice(
    (currentPage_ - 1) * ROWS_PER_PAGE,
    currentPage_ * ROWS_PER_PAGE
  )

  // Summary stats
  const uploadedTabs = TABS.filter((t) => uploadStates[t.key].status === "success").length

  return (
    <div className="space-y-6">
      {/* BANNER */}
      <Banner />

      {/* TABS */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const isDone = uploadStates[tab.key].status === "success"
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm relative ${
                  isActive ? tab.activeColor : tab.color
                } hover:opacity-90`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {isDone && (
                  <span className="w-2 h-2 bg-green-400 rounded-full absolute -top-0.5 -right-0.5" />
                )}
              </button>
            )
          })}
        </div>

        {/* User info + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-xl text-sm">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              SA
            </div>
            <span className="font-medium text-gray-700">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 border border-red-100"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Total Modul</p>
            <h2 className="text-2xl font-bold">{TABS.length}</h2>
            <p className="text-xs text-gray-400">Data sources</p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-xl">📦</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Uploaded</p>
            <h2 className="text-2xl font-bold">{uploadedTabs}</h2>
            <p className="text-xs text-gray-400">Modul aktif</p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-xl">✅</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Total Rows</p>
            <h2 className="text-2xl font-bold">
              {Object.values(uploadStates)
                .reduce((a, s) => a + s.rowCount, 0)
                .toLocaleString()}
            </h2>
            <p className="text-xs text-gray-400">Semua modul</p>
          </div>
          <div className="p-3 rounded-full bg-purple-100 text-xl">📊</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Aktif Sekarang</p>
            <h2 className="text-xl font-bold truncate">{activeTabConfig.label}</h2>
            <p className="text-xs text-gray-400">Tab dipilih</p>
          </div>
          <div className="p-3 rounded-full bg-teal-100 text-xl">{activeTabConfig.icon}</div>
        </div>
      </div>

      {/* UPLOAD SECTION */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>{activeTabConfig.icon}</span>
              Upload Data – {activeTabConfig.label}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{activeTabConfig.description}</p>
          </div>
          {currentState.status === "success" && (
            <button
              onClick={handleReset}
              className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              🗑️ Hapus Data
            </button>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${currentState.status === "success"
              ? "border-green-300 bg-green-50"
              : currentState.status === "error"
              ? "border-red-300 bg-red-50"
              : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50"
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />

          {currentState.status === "loading" && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Membaca file...</p>
            </div>
          )}

          {currentState.status === "idle" && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl">📂</div>
              <p className="font-medium text-gray-600">Klik untuk upload atau drag & drop</p>
              <p className="text-xs text-gray-400">Format: .xlsx, .xls, .csv</p>
            </div>
          )}

          {currentState.status === "success" && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl">✅</div>
              <p className="font-semibold text-green-700">{currentState.fileName}</p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>📄 Sheet: <strong>{currentState.sheetName}</strong></span>
                <span>📊 Kolom: <strong>{currentState.headers.length}</strong></span>
                <span>📝 Baris: <strong>{currentState.rowCount.toLocaleString()}</strong></span>
              </div>
              <p className="text-xs text-green-500">Klik untuk ganti file</p>
            </div>
          )}

          {currentState.status === "error" && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl">⚠️</div>
              <p className="font-medium text-red-600">{currentState.errorMsg}</p>
              <p className="text-xs text-gray-400">Klik untuk coba lagi</p>
            </div>
          )}
        </div>
      </div>

      {/* TABLE PREVIEW */}
      {currentState.status === "success" && currentState.data.length > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-gray-800">
                Preview Data – {activeTabConfig.label}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Menampilkan {(currentPage_ - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(currentPage_ * ROWS_PER_PAGE, currentState.rowCount)} dari{" "}
                {currentState.rowCount.toLocaleString()} baris
              </p>
            </div>

            {/* Export button */}
            <button
              onClick={() => {
                const ws = XLSX.utils.json_to_sheet(currentState.data)
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, currentState.sheetName || "Sheet1")
                XLSX.writeFile(wb, `export_${activeTab}_${Date.now()}.xlsx`)
              }}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600"
            >
              📥 Export Excel
            </button>
          </div>

          {/* Scrollable Table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <th className="px-3 py-3 text-left font-medium text-xs opacity-80 w-10">#</th>
                  {currentState.headers.map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-xs whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-green-50`}
                  >
                    <td className="px-3 py-2 text-gray-400 text-xs">
                      {(currentPage_ - 1) * ROWS_PER_PAGE + i + 1}
                    </td>
                    {currentState.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                        {String(row[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">Halaman {currentPage_} dari {totalPages}</p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage_ === 1}
                  onClick={() => setCurrentPage((prev) => ({ ...prev, [activeTab]: currentPage_ - 1 }))}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Sebelumnya
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let page = idx + 1
                  if (totalPages > 5 && currentPage_ > 3) {
                    page = currentPage_ - 2 + idx
                  }
                  if (page > totalPages) return null
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage((prev) => ({ ...prev, [activeTab]: page }))}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${
                        page === currentPage_
                          ? "bg-green-500 text-white border-green-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}

                <button
                  disabled={currentPage_ === totalPages}
                  onClick={() => setCurrentPage((prev) => ({ ...prev, [activeTab]: currentPage_ + 1 }))}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {currentState.status === "idle" && (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <div className="text-5xl mb-3 opacity-30">📋</div>
          <p className="text-gray-400 font-medium">Belum ada data untuk ditampilkan</p>
          <p className="text-xs text-gray-300 mt-1">
            Upload file Excel di atas untuk melihat preview data
          </p>
        </div>
      )}
    </div>
  )
}
