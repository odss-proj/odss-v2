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

const TEMPLATE_HEADERS: Record<TabKey, string[]> = {
  own_cloud: [
    "KODE SUBDIST","NAMA SUBDIST","DIVISI","TERITORY","AREA","GRSM","REGION",
    "TAHUN","PERIODE","WEEK","KPI","% KEL H+3","% KEL H+7","% Ach",
    "TOTAL SELISIH","KETERANGAN","ASSH","TAS"
  ],

  dt_transfer: [
    "Kode Subdist",
    "Kd Plan",
    "Nama Subdist",
    "COVER",
    "PIC",
    "BAS",
    "ASSH",
    "Area",
    "TAHUN",
    "PERIODE",
    "WEEK",
    "KPI",
    "% ACH"
  ],

  // 🔥 monitoring_wf ternyata sama dengan DT (dari screenshot kamu)
  monitoring_wf: [
    "SUBDIS_ID","SUBDIS_NAME","DIVISI","TYPE","KOTA","REGION","TAS",
    "RELEASE","TGL TRANSFER TERAKHIR","LAMA","cut off","Pekan","Prosentase"
  ],

  logix: [
    "date_logs","email","id_user","user","kd_branch","branch","pic_branch",
    "nomor_ticket","ticket_created_date","ticket_created_detail",
    "ticket_created_in_s","severity","type_supporting","sub_type_supporting",
    "detail_issue","aplikasi","modul","menu","status_ticket","last_state",
    "ticket_close_date","ticket_close_detail","ticket_close_in_s",
    "ticket_durasi","ticket_durasi_in_s","default_respon_time",
    "default_respon_time_by_severity","tas_pic","tas_respon_time",
    "tas_respon_time_in_s","br_pic","br_respon_time","br_respon_time_in_s",
    "dev_pic","dev_respon_time","dev_respon_time_in_s","durasi_ticket_hari",
    "ticket_created_month","date_extract","ticket_in_s","judul_ticket",
    "deskripsi_ticket","note_br","fileset","solved_by"
  ],

  coda: [
    "Flag Report","Req. Type","Year Request","Quartal","Application","APPX",
    "Doc. Date","Doc. Type","Doc. No.","Doc. Name","Description",
    "Status Dev","Status Project","User","User Request","Project",
    "BR PIC","Task PIC_2","Testing PIC 1","Testing PIC 2","Testing PIC 3",
    "Dev PIC","Pilot","Release","Year Done","Bobot Dokumen",
    "Bobot Testing PIC 1","Bobot Testing PIC 2","Bobot Testing PIC 3",
    "YearDone2","Bobot Test2 2025","Test2 Done 2025",
    "Bobot Test3 2025","Test3 Done 2025",
    "Bobot Test1 2026","Test1 Done 2026",
    "Bobot Test2 2026","Test2 Done 2026",
    "Bobot Test3 2026","Test3 Done 2026",

    // 🔥 tambahan dari Master PIC
    "Dept",
    "Sub-Dept"
  ]
}

const normalize = (str: string) =>
  str.toLowerCase().replace(/\s+/g, "").trim()

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

const handleFileUpload = async (file: File) => {
  try {
    setUploadStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        status: "loading",
        errorMsg: undefined,
      },
    }))

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)

    let jsonData: Record<string, any>[] = []
    let sheetName = ""

    if (activeTab === "coda") {
      // =========================
      // 🔥 CODA SPECIAL LOGIC
      // =========================

      const sourceSheet = workbook.Sheets["Source 2025 + 2026.W15"]
      const masterSheet = workbook.Sheets["Master PIC"]

      if (!sourceSheet || !masterSheet) {
        throw new Error("Sheet CODA tidak lengkap (butuh Source & Master PIC)")
      }

      const sourceData = XLSX.utils.sheet_to_json<Record<string, any>>(sourceSheet, {
        defval: null,
      })

      const masterData = XLSX.utils.sheet_to_json<Record<string, any>>(masterSheet, {
        defval: null,
      })

      // normalize helper
      const normalizeText = (str: string) =>
        str?.toLowerCase().trim()

      // mapping PIC
      const picMap: Record<string, any> = {}

      masterData.forEach((row) => {
        const pic = normalizeText(row["PIC"])
        if (pic) {
          picMap[pic] = {
            dept: row["Dept."],
            subDept: row["Sub-Dept"],
          }
        }
      })

      // merge data
      jsonData = sourceData.map((row) => {
        const pic = normalizeText(row["PIC"])
        const extra = picMap[pic] || {}

        return {
          ...row,
          Dept: extra.dept || null,
          "Sub-Dept": extra.subDept || null,
        }
      })

      sheetName = "Merged CODA"
    } else {
      // =========================
      // DEFAULT (SEMUA TAB LAIN)
      // =========================
      sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: null,
      })
    }

    if (!jsonData) {
      throw new Error("File tidak valid")
    }

    const headers = jsonData.length > 0
      ? Object.keys(jsonData[0])
      : []

    const safeData = jsonData.length ? jsonData : []

    const expectedHeaders = TEMPLATE_HEADERS[activeTab]

    if (!expectedHeaders) {
      throw new Error("Template tab tidak ditemukan")
    }

    const normalizedHeaders = headers.map(normalize)
    const normalizedExpected = expectedHeaders.map(normalize)

    const missingHeaders = normalizedExpected.filter(
      (h) => !normalizedHeaders.includes(h)
    )

    if (missingHeaders.length > 0) {
      throw new Error(
        `Kolom tidak sesuai: ${missingHeaders.join(", ")}`
      )
    }

    const reorderedData = jsonData.map((row) => {
      const newRow: Record<string, any> = {}

      expectedHeaders.forEach((header) => {
        const foundKey = Object.keys(row).find(
          (k) => normalize(k) === normalize(header)
        )
        newRow[header] = foundKey ? row[foundKey] : null
      })

      return newRow
    })

    setUploadStates((prev) => ({
      ...prev,
      [activeTab]: {
        fileName: file.name,
        data: reorderedData,
        headers: expectedHeaders,
        sheetName: sheetName,
        rowCount: reorderedData.length, // 🔥 INI YANG KURANG
        status: "success",
        errorMsg: "",
      },
    }))
  } catch (error: any) {
    setUploadStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...initialUploadState,
        status: "error",
        fileName: file.name,
        errorMsg: error.message,
      },
    }))
  }
}

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    handleFileUpload(file)
  }
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

  const isAllUploaded = uploadedTabs === TABS.length
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

        {/* Button Send DB */}
        <div className="flex items-center gap-3">
          <button
            disabled={!isAllUploaded}
            onClick={() => {
              console.log("🚀 Send to DB triggered")
              // nanti kita isi logic supabase di sini
            }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition
              ${
                isAllUploaded
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {isAllUploaded ? "🚀 Send to DB" : `⏳ Upload ${uploadedTabs}/${TABS.length}`}
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
                .reduce((a, s) => a +(s.rowCount || 0), 0)
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
                onChange={handleFileChange}
                className="hidden"
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
                <span>📝 Baris: <strong>{(currentState.rowCount || 0).toLocaleString()}</strong></span>
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
                {Math.min(currentPage_ * ROWS_PER_PAGE, currentState.rowCount || 0)} dari{" "}
                {(currentState.rowCount || 0).toLocaleString()} baris
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
