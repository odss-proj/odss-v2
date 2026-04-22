"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { supabase } from "../../lib/supabase"

type AppsTabKey    = "dt_transfer" | "own_cloud" | "monitoring_wf" | "coda" | "logix"
type MdmTabKey    = "mdm_setting"
type DevTabKey    = "dev_coda" | "dev_sprint" | "dev_backlog"
type GlobalTabKey = "global_backup" | "global_restore" | "global_backlog" | "global_pilot" | "global_vm"
type TabKey       = AppsTabKey | MdmTabKey | DevTabKey | GlobalTabKey
type Section      = "apps" | "mdm" | "dev" | "global"

type TabConfig = {
  key: TabKey; label: string; icon: string
  color: string; activeColor: string; description: string; section: Section
}

type UploadState = {
  isFromUpload?: boolean; fileName: string | null
  data: Record<string, unknown>[]; headers: string[]
  sheetName: string; rowCount: number
  status: "idle" | "loading" | "success" | "error"; errorMsg: string
}

const initialUploadState: UploadState = {
  fileName: null, data: [], headers: [], sheetName: "", rowCount: 0, status: "idle", errorMsg: "",
}

const parsePercent = (val: unknown): number => {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return val <= 1 ? val * 100 : val
  if (typeof val === "string") return Number(val.replace("%", "").trim())
  return 0
}

const parseDate = (val: unknown): string | null => {
  if (!val) return null

  // Date object dari xlsx (cellDates:true) — ambil komponen lokal, bukan UTC
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null
    const y = val.getFullYear()
    // Validasi tahun wajar — tolak nilai aneh seperti year 45721
    if (y < 1900 || y > 2099) return null
    const m = String(val.getMonth() + 1).padStart(2, "0")
    const d = String(val.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  // Number: bisa Excel serial (< 60000) atau format YYYYMMDD (8 digit, > 20000000)
  if (typeof val === "number") {
    // Format YYYYMMDD (contoh: 20250226)
    if (val >= 19000101 && val <= 21001231) {
      const s = String(Math.round(val))
      if (s.length === 8) {
        const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8)
        const dt = new Date(`${y}-${m}-${d}`)
        if (!isNaN(dt.getTime())) return `${y}-${m}-${d}`
      }
    }
    // Excel serial date (1 Jan 1900 = 1)
    if (val > 0 && val < 2958466) {
      const epoch = new Date(1899, 11, 30)
      const dt = new Date(epoch.getTime() + val * 86400000)
      const y = dt.getFullYear()
      if (y < 1900 || y > 2099) return null
      const m = String(dt.getMonth() + 1).padStart(2, "0")
      const d = String(dt.getDate()).padStart(2, "0")
      return `${y}-${m}-${d}`
    }
    return null
  }

  // String
  if (typeof val === "string" && val.trim()) {
    const s = val.trim()
    // Sudah format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    // Format DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split("/")
      return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`
    }
    // Format YYYYMMDD string
    if (/^\d{8}$/.test(s)) {
      const y = s.slice(0,4), m = s.slice(4,6), d = s.slice(6,8)
      return `${y}-${m}-${d}`
    }
    // Generic parse — gunakan komponen lokal
    const dt = new Date(s)
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear()
      if (y < 1900 || y > 2099) return null
      const mo = String(dt.getMonth() + 1).padStart(2, "0")
      const dy = String(dt.getDate()).padStart(2, "0")
      return `${y}-${mo}-${dy}`
    }
  }

  return null
}

const num  = (v: unknown) => { if (v === null || v === undefined || v === "") return null; if (v instanceof Date) return null; const n = Number(v); return isNaN(n) ? null : n }
const str  = (v: unknown) => { if (v === null || v === undefined) return null; if (v instanceof Date) return null; return String(v) }
const bool = (v: unknown) => v === true || v === 1 || v === "TRUE" || v === "true"
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "").trim()

const getTableName = (tab: TabKey): string => {
  switch (tab) {
    case "mdm_setting":    return "mdm_monitoring_setting"
    case "coda":           return "coda_main"
    case "area_cover":     return "area_cover_cns"
    case "dev_coda":       return "data_source_coda"
    case "dev_sprint":     return "data_source_dev_sprint"
    case "dev_backlog":    return "data_source_project_backlog"
    case "global_backup":  return "global_backup"
    case "global_restore": return "global_restore"
    case "global_backlog": return "global_backlog"
    case "global_pilot":   return "global_vm_monitoring"
    case "global_vm":      return "area_cover_cns"
    default:               return tab
  }
}

const mapDataByTab = (tab: TabKey, data: Record<string, unknown>[]): Record<string, unknown>[] => {
  switch (tab) {
    case "dt_transfer": return data.map((r) => ({
      kode_subdist: num(r["Kode Subdist"]), kd_plan: str(r["Kd Plan"]), nama_subdist: str(r["Nama Subdist"]),
      cover: str(r["COVER"]), pic: str(r["PIC"]), bas: str(r["BAS"]), assh: str(r["ASSH"]),
      area: str(r["Area"]), tahun: num(r["TAHUN"]), periode: num(r["PERIODE"]), week: num(r["WEEK"]),
      kpi: str(r["KPI"]), ach: parsePercent(r["% ACH"]),
    }))
    case "own_cloud": return data.map((r) => ({
      kode_subdist: num(r["KODE SUBDIST"]), nama_subdist: str(r["NAMA SUBDIST"]), divisi: str(r["DIVISI"]),
      territory: str(r["TERITORY"]), area: str(r["AREA"]), grsm: str(r["GRSM"]), region: str(r["REGION"]),
      tahun: num(r["TAHUN"]), periode: num(r["PERIODE"]), week: num(r["WEEK"]), kpi: str(r["KPI"]),
      kel_h3: parsePercent(r["% KEL H+3"]), kel_h7: parsePercent(r["% KEL H+7"]), ach: parsePercent(r["% Ach"]),
      total_selisih: r["TOTAL SELISIH"] ? num(r["TOTAL SELISIH"]) : null,
      keterangan: str(r["KETERANGAN"]) ?? "", assh: str(r["ASSH"]), tas: str(r["TAS"]),
    }))
    case "monitoring_wf": return data.map((r) => ({
      subdis_id: num(r["SUBDIS_ID"]), subdis_name: str(r["SUBDIS_NAME"]), divisi: str(r["DIVISI"]),
      type: str(r["TYPE"]), kota: str(r["KOTA"]), region: str(r["REGION"]), tas: str(r["TAS"]),
      release: num(r["RELEASE"]), tgl_transfer: parseDate(r["TGL TRANSFER TERAKHIR"]),
      lama: num(r["LAMA"]), cut_off: parseDate(r["cut off"]), pekan: num(r["Pekan"]),
      prosentase: parsePercent(r["Prosentase"]),
    }))
    case "logix": return data.map((r) => ({
      date_logs: r["date_logs"] ? parseDate(r["date_logs"]) : null,
      email: str(r["email"]), id_user: r["id_user"], user_name: str(r["user"]),
      kd_branch: r["kd_branch"], branch: str(r["branch"]), pic_branch: str(r["pic_branch"]),
      nomor_ticket: str(r["nomor_ticket"]),
      ticket_created_date: r["ticket_created_date"] ? parseDate(r["ticket_created_date"]) : null,
      ticket_created_detail: str(r["ticket_created_detail"]), ticket_created_in_s: num(r["ticket_created_in_s"]) ?? 0,
      severity: str(r["severity"]), type_supporting: str(r["type_supporting"]),
      sub_type_supporting: str(r["sub_type_supporting"]), detail_issue: str(r["detail_issue"]),
      aplikasi: str(r["aplikasi"]), modul: str(r["modul"]), menu: str(r["menu"]),
      status_ticket: str(r["status_ticket"]), last_state: str(r["last_state"]),
      ticket_close_date: r["ticket_close_date"] ? parseDate(r["ticket_close_date"]) : null,
      ticket_close_detail: str(r["ticket_close_detail"]), ticket_close_in_s: num(r["ticket_close_in_s"]) ?? 0,
      ticket_durasi: str(r["ticket_durasi"]), ticket_durasi_in_s: num(r["ticket_durasi_in_s"]) ?? 0,
      default_respon_time: str(r["default_respon_time"]),
      default_respon_time_by_severity: str(r["default_respon_time_by_severity"]),
      tas_pic: str(r["tas_pic"]), tas_respon_time: str(r["tas_respon_time"]),
      tas_respon_time_in_s: num(r["tas_respon_time_in_s"]) ?? 0,
      br_pic: str(r["br_pic"]), br_respon_time: str(r["br_respon_time"]),
      br_respon_time_in_s: num(r["br_respon_time_in_s"]) ?? 0,
      dev_pic: str(r["dev_pic"]), dev_respon_time: str(r["dev_respon_time"]),
      dev_respon_time_in_s: num(r["dev_respon_time_in_s"]) ?? 0,
      durasi_ticket_hari: num(r["durasi_ticket_hari"]) ?? 0,
      ticket_created_month: str(r["ticket_created_month"]),
      date_extract: r["date_extract"] ? parseDate(r["date_extract"]) : null,
      ticket_in_s: num(r["ticket_in_s"]) ?? 0, judul_ticket: str(r["judul_ticket"]),
      deskripsi_ticket: str(r["deskripsi_ticket"]), note_br: str(r["note_br"]),
      fileset: str(r["fileset"]), solved_by: str(r["solved_by"]),
    }))
    case "coda": return data.map((r) => ({
      flag_report: str(r["Flag Report"]), req_type: str(r["Req. Type"]),
      year_request: num(r["Year Request"]), quartal: str(r["Quartal"]),
      application: str(r["Application"]), appx: str(r["APPX"]),
      doc_date: r["Doc. Date"] ? parseDate(r["Doc. Date"]) : null,
      doc_type: str(r["Doc. Type"]), doc_no: str(r["Doc. No."]), doc_name: str(r["Doc. Name"]),
      description: str(r["Description"]), status_dev: str(r["Status Dev"]),
      status_project: str(r["Status Project"]), user_name: str(r["User"]),
      user_request: str(r["User Request"]), project: str(r["Project"]),
      br_pic: str(r["BR PIC"]), task_pic_2: str(r["Task PIC_2"]),
      testing_pic_1: str(r["Testing PIC 1"]), testing_pic_2: str(r["Testing PIC 2"]),
      testing_pic_3: str(r["Testing PIC 3"]), dev_pic: str(r["Dev PIC"]),
      pilot: str(r["Pilot"]), release: str(r["Release"]), year_done: num(r["Year Done"]),
      bobot_dokumen: num(r["Bobot Dokumen"]) ?? 0,
      bobot_testing_pic_1: num(r["Bobot Testing PIC 1"]) ?? 0,
      bobot_testing_pic_2: num(r["Bobot Testing PIC 2"]) ?? 0,
      bobot_testing_pic_3: num(r["Bobot Testing PIC 3"]) ?? 0,
      yeardone2: num(r["YearDone2"]) ?? 0,
      bobot_test2_2025: num(r["Bobot Test2 2025"]) ?? 0, test2_done_2025: num(r["Test2 Done 2025"]) ?? 0,
      bobot_test3_2025: num(r["Bobot Test3 2025"]) ?? 0, test3_done_2025: num(r["Test3 Done 2025"]) ?? 0,
      bobot_test1_2026: num(r["Bobot Test1 2026"]) ?? 0, test1_done_2026: num(r["Test1 Done 2026"]) ?? 0,
      bobot_test2_2026: num(r["Bobot Test2 2026"]) ?? 0, test2_done_2026: num(r["Test2 Done 2026"]) ?? 0,
      bobot_test3_2026: num(r["Bobot Test3 2026"]) ?? 0, test3_done_2026: num(r["Test3 Done 2026"]) ?? 0,
    }))
    case "mdm_setting": return data.map((r) => ({
      no:                   num(r["NO"]),
      kode_ap:              str(r["KODE AP"]),
      deskripsi:            str(r["DESKRIPSI"]),
      jml_setting:          num(r["JML SETTING"]),
      from_source:                 str(r["FROM"]),
      kategori:             str(r["KATEGORI"]),
      type:                 str(r["TYPE"]),
      bobot_setting:        num(r["BOBOT SETTING"]),
      global_div:           str(r["GLOBAL DIV"]),
      div:                  str(r["DIV"]),
      sub_div:              str(r["SUB DIV"]),
      level:                str(r["LEVEL"]),
      tgl_email:            parseDate(r["TGL EMAIL"]),
      tgl_konfirmasi_akhir: parseDate(r["TGL KONFIRMASI AKHIR"]),
      tgl_awal_program:     parseDate(r["TGL AWAL PROGRAM"]),
      tgl_akhir_program:    parseDate(r["TGL AKHIR PROGRAM"]),
      tgl_setting:          parseDate(r["TGL SETTING"]),
      pic_setting:          str(r["PIC SETTING"]),
      status:               str(r["STATUS"]),
      tgl_controller:       parseDate(r["TGL CONTROLLER"]),
      pic_controller:       str(r["PIC CONTROLLER"]),
      status_controller:    str(r["STATUS CONTROLLER"]),
      note_controller:      str(r["NOTE CONTROLLER"]),
      tgl_release:          parseDate(r["TGL RELEASE"]),
      pic_release:          str(r["PIC RELEASE"]),
      status_release:       str(r["STATUS RELEASE"]),
      note_release:         str(r["NOTE RELEASE"]),
    }))
        case "dev_coda": return data.map((r) => ({
      adop_project_backlog: str(r["ADOP Project Backlog"]), project: str(r["Project"]),
      application: str(r["Application"]), year_dev: num(r["Year Dev"]),
      year_done: str(r["Year Done"]),   // TEXT: nilai seperti "2026.Q1.3.9"
      doc_type: str(r["Doc. Type"]), doc_name: str(r["Doc. Name"]), tshirt_sizing: str(r["Tshirt Sizing"]),
      dev_point: num(r["Dev. Point"]), dev_pic: str(r["Dev PIC"]), status_dev: str(r["Status Dev"]),
      work_complete: num(r["Work Complete"]), start_date: parseDate(r["Start Date"]),
      finish_date: parseDate(r["Finish Date"]), deadline: parseDate(r["Deadline"]),
      pilot: str(r["Pilot"]), release: str(r["Release"]), test_cycle: str(r["Test Cycle"]),
      doc_cycle: str(r["Doc. Cycle"]), year_request: num(r["Year Request"]), quartal: str(r["Quartal"]),
      doc_date: parseDate(r["Doc. Date"]), user: str(r["User"]), user_request: str(r["User Request"]),
      plan_pilot: str(r["Plan Pilot"]), dev_sprint_ds: str(r["Dev Sprint (DS)"]),
      group_dev: str(r["Group Dev"]), bobot_dokumen: num(r["Bobot Dokumen"]), appx: str(r["appx"]),
      is_empty_deadline: bool(r["is_empty_deadline"]), is_empty_dev_point: bool(r["is_empty_dev_point"]),
      is_empty_doc_point: bool(r["is_empty_doc_point"]), dev_point_bugs: num(r["Dev Point Bugs"]),
      flag_bugs: bool(r["flag_bugs"]), flag_on_time: bool(r["flag_on_time"]),
      flag_testing: str(r["flag_testing"]), flag_pilot: str(r["flag_pilot"]),
      flag_done_dev: str(r["flag_done_dev"]),
    }))
    case "dev_sprint": return data.map((r) => ({
      sprint: str(r["Sprint"]), adop_sprint: num(r["ADOP Sprint"]),  // NUMERIC: 2026.1
      adop_project_backlog: str(r["ADOP Project Backlog"]), product_backlog: str(r["Product Backlog"]),
      sprint_pic: str(r["Sprint PIC"]), dev_pic_pb: str(r["Dev PIC (PB)"]),
      workload_pb: num(r["Workload (PB)"]), plan_start: parseDate(r["Plan Start"]),
      plan_finish: parseDate(r["Plan Finish"]), pct_sprint: num(r["% Sprint"]),
      pct_exp_result: num(r["% Exp. Result"]), is_plan: bool(r["Is Plan"]),
      status_dev_pb: str(r["Status Dev (PB)"]), tshirt_sizing_pb: str(r["Tshirt Sizing (PB)"]),
      dev_point_pb: num(r["Dev. Point (PB)"]), work_complete_pb: num(r["Work Complete (PB)"]),
      start_date_pb: parseDate(r["Start Date (PB)"]), finish_date_pb: parseDate(r["Finish Date (PB)"]),
      deadline_pb: parseDate(r["Deadline (PB)"]), test_cycle_pb: str(r["Test Cycle (PB)"]),
      doc_cycle_pb: str(r["Doc. Cycle (PB)"]), is_empty_dev_point: bool(r["is_empty_dev_point"]),
    }))
    case "dev_backlog": return data.map((r) => ({
      user: str(r["User"]), application: str(r["Application"]), kpi: str(r["KPI"]),
      request: str(r["Request"]), status_ss: str(r["Status SS"]), status_project: str(r["Status Project"]),
      time_request: str(r["Time Request"]), deadline: str(r["Deadline"]), timeline: str(r["Timeline"]),
      pct_work_complete: num(r["%Work Complete"]), pic_dev: str(r["PIC Dev"]),
      dev_group: str(r["Dev Group"]), pic_br: str(r["PIC BR"]), pic_apps: str(r["PIC Apps"]),
      doc_ref: str(r["Doc. Ref."]), status_dev: str(r["Status Dev"]),
      review_sprint: str(r["Review Sprint"]), dev_sprint: num(r["Dev Sprint"]),   // NUMERIC: 2025.39
      adop_sprint: num(r["ADOP Sprint"]),                                          // NUMERIC: 2026.3
      weekly_report: str(r["Weekly Report"]),
      flag_sprint: str(r["Flag Sprint"]), flag_tracking: str(r["Flag Tracking"]),
      weekly_sprint: str(r["Weekly Sprint"]), remark: str(r["Remark"]),
    }))
    case "area_cover": return data.map((r) => ({
      status:           str(r["STATUS"]),
      kode_subdist:     num(r["Kode Subdist"]),
      kd_plan:          str(r["Kd Plan"]),
      nama_subdist:     str(r["Nama Subdist"]),
      cover:            str(r["COVER"]),
      pic:              str(r["PIC"]),
      bas:              str(r["BAS"]),
      assh:             str(r["ASSH"]),
      area:             str(r["Area"]),
      type:             str(r["Type"]),
      divisi:           str(r["Divisi"]),
      reg_rom:          str(r["REG/ROM"]),
      vm:               str(r["VM"]),
      schema_name:      str(r["Schema"]),
      db_utama:         str(r["DB Utama"]),
      salesman_non_sfa: num(r["SALESMAN NON SFA"]),
      salesman_sfa:     num(r["SALESMAN SFA"]),
      user_ficom:       num(r["USER"]),
      jmlh_faktur_lm:   num(r["Jmlh Faktur LM"]),
      size_datafile_gb: num(r["Size Datafile in GB"]),
      total_salesman:   num(r["Total Salesman"]),
      drive_vm:         str(r["Drive VM"]),
      bom:              str(r["BOM"]),
      region:           str(r["REGION"]),
      rom:              str(r["ROM"]),
      nom:              str(r["NOM"]),
      cabang:           str(r["CABANG"]),
      bom_aos_aom:      str(r["BOM/AOS/AOM"]),
      salesman_count:   num(r["SALESMAN"]),
      user_count:       num(r["USER (CNS)"]),
      size_db:          num(r["SIZE DB"]),
    }))
    case "global_backup": return data.map((r) => {
      // Hitung dari WEEK 1-52
      const weekKeys = Array.from({length:52}, (_,i) => `WEEK ${i+1}`)
      const done = weekKeys.filter(w => r[w] !== null && r[w] !== undefined && r[w] !== "").length
      let latestWeek: string | null = null
      for (let i = 52; i >= 1; i--) {
        if (r[`WEEK ${i}`] !== null && r[`WEEK ${i}`] !== undefined && r[`WEEK ${i}`] !== "") {
          latestWeek = `WEEK ${i}`; break
        }
      }
      return {
        adp_code: num(r["NO"]),
        aor: str(r["AOR"]), server: num(r["SERVER"]),
        adp_name: str(r["ADP NAME"]), support: str(r["SUPPORT"]),
        db_schema: str(r["DB SCHEMA"]), db_utama: str(r["DB UTAMA"]),
        total_backup_done: done, total_weeks: 52,
        backup_completion_pct: Math.round(done / 52 * 100 * 10) / 10,
        latest_week_backup: latestWeek,
      }
    })
    case "global_restore": return data.map((r) => ({
      no: num(r["NO"]), area: str(r["AREA"]), server: num(r["Server"]),
      adp_code: num(r["ADP CODE"]), adp_name: str(r["ADP NAME"]),
      month: parseDate(r["MONTH"]), restore_date: str(r["RESTORE DATE"]),
      trans_date: parseDate(r["TRANS DATE"]), backup_size: str(r["BACKUP SIZE"]),
      backup_tools_version: str(r["BACKUP TOOLS VERSION"]),
      restore_status: str(r["RESTORE STATUS"]),
      pic_restore: str(r["PIC RESTORE"]), pic_phi: str(r["PIC PHI"]),
    }))
    case "global_backlog": return data.map((r) => ({
      no: num(r["No."]),
      category: str(Object.values(r)[0]),  // kolom pertama (kolom tanpa nama)
      concern: str(r["Concern"]),
      remark: str(r["Remark"]),
      concern_pic: str(r["Concern PIC"]),
      app: str(r["App"]), type: str(r["Type"]), priority: num(r["Priority"]),
      status: str(r["Status"]), note: str(r["Note"]),
      no_document: str(r["No Document"]), pic_request: str(r["PIC Request"]),
    }))
    case "global_pilot": return data.map((r) => ({
      vm: str(r["VM"]), drive: str(r["Drive"]),
      total_gb: num(r["Total (GB)"]), free_gb: num(r["Free (GB)"]),
      used_gb: num(r["Used (GB)"]), used_pct: num(r["Used %"]),
      update_date: "2026-04-20",
      w1:  num(r["W1"]),  w2:  num(r["W2"]),  w3:  num(r["W3"]),  w4:  num(r["W4"]),
      w5:  num(r["W5"]),  w6:  num(r["W6"]),  w7:  num(r["W7"]),  w8:  num(r["W8"]),
      w9:  num(r["W9"]),  w10: num(r["W10"]), w11: num(r["W11"]), w12: num(r["W12"]),
      w13: num(r["W13"]), w14: num(r["W14"]), w15: num(r["W15"]), w16: num(r["W16"]),
    }))
    case "global_vm": return data.map((r) => ({
      status:           str(r["STATUS"]),
      kode_subdist:     num(r["Kode Subdist"]),
      kd_plan:          str(r["Kd Plan"]),
      nama_subdist:     str(r["Nama Subdist"]),
      cover:            str(r["COVER"]),
      pic:              str(r["PIC"]),
      bas:              str(r["BAS"]),
      assh:             str(r["ASSH"]),
      area:             str(r["Area"]),
      type:             str(r["Type"]),
      divisi:           str(r["Divisi"]),
      reg_rom:          str(r["REG/ROM"]),
      vm:               str(r["VM"]),
      schema_name:      str(r["Schema"]),
      db_utama:         str(r["DB Utama"]),
      salesman_non_sfa: num(r["SALESMAN NON SFA"]),
      salesman_sfa:     num(r["SALESMAN SFA"]),
      user_ficom:       num(r["USER"]),
      jmlh_faktur_lm:   num(r["Jmlh Faktur LM"]),
      size_datafile_gb: num(r["Size Datafile in GB"]),
      total_salesman:   num(r["Total Salesman"]),
      drive_vm:         str(r["Drive VM"]),
      bom:              str(r["BOM"]),
      region:           str(r["REGION"]),
      rom:              str(r["ROM"]),
      nom:              str(r["NOM"]),
      cabang:           str(r["CABANG"]),
      bom_aos_aom:      str(r["BOM/AOS/AOM"]),
      salesman_count:   num(r["SALESMAN"]),
      user_count:       num(r["USER (CNS)"]),
      size_db:          num(r["SIZE DB"]),
    }))
    default: return data
  }
}

const getKey = (tab: TabKey, row: Record<string, unknown>): string => {
  switch (tab) {
    case "logix":      return String(row.nomor_ticket ?? JSON.stringify(row))
    case "coda":       return String(row.doc_no ?? JSON.stringify(row))
    case "dt_transfer": return `${row.kode_subdist}-${row.periode}-${row.week}`
    case "dev_coda":   return `${row.doc_name}-${row.dev_pic}-${row.year_dev}`
    case "dev_sprint": return `${row.sprint}-${row.product_backlog}-${row.dev_pic_pb}`
    case "dev_backlog": return `${row.request}-${row.dev_sprint}-${row.pic_dev}`
    case "area_cover":    return `${row.kode_subdist}`
    case "global_backup":  return `${row.adp_code}-${row.server}`
    case "global_restore": return `${row.adp_code}-${row.month}`
    case "global_backlog": return `${row.no}-${row.concern}`
    case "global_pilot":   return `${row.vm}-${row.drive}`
    case "global_vm":      return `${row.kode_subdist}`
    default:           return JSON.stringify(row)
  }
}

const TEMPLATE_HEADERS: Record<TabKey, string[]> = {
  own_cloud: ["KODE SUBDIST","NAMA SUBDIST","DIVISI","TERITORY","AREA","GRSM","REGION","TAHUN","PERIODE","WEEK","KPI","% KEL H+3","% KEL H+7","% Ach","TOTAL SELISIH","KETERANGAN","ASSH","TAS"],
  mdm_setting: ["NO","KODE AP","DESKRIPSI","JML SETTING","FROM","KATEGORI","TYPE","BOBOT SETTING","GLOBAL DIV","DIV","SUB DIV","LEVEL","TGL EMAIL","TGL KONFIRMASI AKHIR","TGL AWAL PROGRAM","TGL AKHIR PROGRAM","TGL SETTING","PIC SETTING","STATUS","TGL CONTROLLER","PIC CONTROLLER","STATUS CONTROLLER","NOTE CONTROLLER","TGL RELEASE","PIC RELEASE","STATUS RELEASE","NOTE RELEASE"],
  dt_transfer: ["Kode Subdist","Kd Plan","Nama Subdist","COVER","PIC","BAS","ASSH","Area","TAHUN","PERIODE","WEEK","KPI","% ACH"],
  monitoring_wf: ["SUBDIS_ID","SUBDIS_NAME","DIVISI","TYPE","KOTA","REGION","TAS","RELEASE","TGL TRANSFER TERAKHIR","LAMA","cut off","Pekan","Prosentase"],
  logix: ["date_logs","email","id_user","user","kd_branch","branch","pic_branch","nomor_ticket","ticket_created_date","ticket_created_detail","ticket_created_in_s","severity","type_supporting","sub_type_supporting","detail_issue","aplikasi","modul","menu","status_ticket","last_state","ticket_close_date","ticket_close_detail","ticket_close_in_s","ticket_durasi","ticket_durasi_in_s","default_respon_time","default_respon_time_by_severity","tas_pic","tas_respon_time","tas_respon_time_in_s","br_pic","br_respon_time","br_respon_time_in_s","dev_pic","dev_respon_time","dev_respon_time_in_s","durasi_ticket_hari","ticket_created_month","date_extract","ticket_in_s","judul_ticket","deskripsi_ticket","note_br","fileset","solved_by"],
  coda: ["Flag Report","Req. Type","Year Request","Quartal","Application","APPX","Doc. Date","Doc. Type","Doc. No.","Doc. Name","Description","Status Dev","Status Project","User","User Request","Project","BR PIC","Task PIC_2","Testing PIC 1","Testing PIC 2","Testing PIC 3","Dev PIC","Pilot","Release","Year Done","Bobot Dokumen","Bobot Testing PIC 1","Bobot Testing PIC 2","Bobot Testing PIC 3","YearDone2","Bobot Test2 2025","Test2 Done 2025","Bobot Test3 2025","Test3 Done 2025","Bobot Test1 2026","Test1 Done 2026","Bobot Test2 2026","Test2 Done 2026","Bobot Test3 2026","Test3 Done 2026","Dept","Sub-Dept"],
  area_cover: [
    "STATUS","Kode Subdist","Kd Plan","Nama Subdist","COVER","PIC","BAS","ASSH",
    "Area","Type","Divisi","REG/ROM","VM","Schema","BOM","REGION","ROM","NOM",
  ],
  dev_coda: ["ADOP Project Backlog","Project","Application","Year Dev","Year Done","Doc. Type","Doc. Name","Tshirt Sizing","Dev. Point","Dev PIC","Status Dev","Work Complete","Start Date","Finish Date","Deadline","Pilot","Release","Test Cycle","Doc. Cycle","Year Request","Quartal","Doc. Date","User","User Request","Plan Pilot","Dev Sprint (DS)","Group Dev","Bobot Dokumen","appx","is_empty_deadline","is_empty_dev_point","is_empty_doc_point","Dev Point Bugs","flag_bugs","flag_on_time","flag_testing","flag_pilot","flag_done_dev"],
  dev_sprint: ["Sprint","ADOP Sprint","ADOP Project Backlog","Product Backlog","Sprint PIC","Dev PIC (PB)","Workload (PB)","Plan Start","Plan Finish","% Sprint","% Exp. Result","Is Plan","Status Dev (PB)","Tshirt Sizing (PB)","Dev. Point (PB)","Work Complete (PB)","Start Date (PB)","Finish Date (PB)","Deadline (PB)","Test Cycle (PB)","Doc. Cycle (PB)","is_empty_dev_point"],
  dev_backlog: ["User","Application","KPI","Request","Status SS","Status Project","Time Request","Deadline","Timeline","%Work Complete","PIC Dev","Dev Group","PIC BR","PIC Apps","Doc. Ref.","Status Dev","Review Sprint","Dev Sprint","ADOP Sprint","Weekly Report","Flag Sprint","Flag Tracking","Weekly Sprint","Remark"],
  global_backup:  ["NO","AOR","SERVER","ADP NAME","SUPPORT","DB SCHEMA","DB UTAMA","WEEK 1","WEEK 2","WEEK 3","WEEK 4","WEEK 5","WEEK 6","WEEK 7","WEEK 8","WEEK 9","WEEK 10","WEEK 11","WEEK 12","WEEK 13","WEEK 14","WEEK 15","WEEK 16","WEEK 17","WEEK 18","WEEK 19","WEEK 20","WEEK 21","WEEK 22","WEEK 23","WEEK 24","WEEK 25","WEEK 26","WEEK 27","WEEK 28","WEEK 29","WEEK 30","WEEK 31","WEEK 32","WEEK 33","WEEK 34","WEEK 35","WEEK 36","WEEK 37","WEEK 38","WEEK 39","WEEK 40","WEEK 41","WEEK 42","WEEK 43","WEEK 44","WEEK 45","WEEK 46","WEEK 47","WEEK 48","WEEK 49","WEEK 50","WEEK 51","WEEK 52"],
  global_restore: ["NO","AREA","Server","ADP CODE","ADP NAME","MONTH","RESTORE DATE","TRANS DATE","BACKUP SIZE","BACKUP TOOLS VERSION","RESTORE STATUS","PIC RESTORE","PIC PHI"],
  global_backlog: ["No.","Concern","Remark","Concern PIC","App","Type","Priority","Status","Note","No Document","PIC Request"],
  global_pilot:   ["VM","Drive","Total (GB)","Free (GB)","Used (GB)","Used %","W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13","W14","W15","W16"],
  global_vm: [
    "STATUS","Kode Subdist","Kd Plan","Nama Subdist","COVER","PIC","BAS","ASSH",
    "Area","Type","Divisi","REG/ROM","VM","Schema","BOM","REGION","ROM","NOM",
  ],
}

const APPS_TABS: TabConfig[] = [
  { key:"dt_transfer",  label:"DT Transfer",   icon:"🔄", color:"bg-gray-100 text-gray-600", activeColor:"bg-blue-500 text-white",   description:"Upload data transfer untuk sinkronisasi sistem",          section:"apps" },
  { key:"own_cloud",    label:"Own Cloud",      icon:"☁️", color:"bg-gray-100 text-gray-600", activeColor:"bg-teal-500 text-white",   description:"Kelola data cloud storage dan sinkronisasi file",         section:"apps" },
  { key:"monitoring_wf",label:"Monitoring WF",  icon:"📊", color:"bg-gray-100 text-gray-600", activeColor:"bg-green-500 text-white",  description:"Monitoring workflow dan status pengerjaan",               section:"apps" },
  { key:"coda",         label:"Coda",           icon:"📋", color:"bg-gray-100 text-gray-600", activeColor:"bg-purple-500 text-white", description:"Upload dan sinkronisasi data dari Coda",                  section:"apps" },
  { key:"logix",        label:"Logix",          icon:"🚚", color:"bg-gray-100 text-gray-600", activeColor:"bg-orange-500 text-white", description:"Import data logistik dan pengiriman dari Logix",          section:"apps" },
]

const MDM_TABS: TabConfig[] = [
  { key:"mdm_setting", label:"Monitoring Setting", icon:"📐", color:"bg-gray-100 text-gray-600", activeColor:"bg-blue-500 text-white", description:"Upload data Monitoring Setting MDM dari file MDM_2026.xlsx — sheet 'Monitoring Setting 2026'", section:"mdm" },
]

const DEV_TABS: TabConfig[] = [
  { key:"dev_coda",    label:"Data Source (CODA)",           icon:"📋", color:"bg-gray-100 text-gray-600", activeColor:"bg-purple-500 text-white", description:"Upload sheet 'Data Source (CODA)' dari BiWeekly Report",           section:"dev" },
  { key:"dev_sprint",  label:"Data Source (Dev Sprint)",     icon:"🏃", color:"bg-gray-100 text-gray-600", activeColor:"bg-blue-500 text-white",   description:"Upload sheet 'Data Source (Dev Sprint)' dari BiWeekly Report",     section:"dev" },
  { key:"dev_backlog", label:"Data Source (Project Backlog)",icon:"📌", color:"bg-gray-100 text-gray-600", activeColor:"bg-orange-500 text-white", description:"Upload sheet 'Data Source (Project Backlog)' dari BiWeekly Report", section:"dev" },
]

const GLOBAL_TABS: TabConfig[] = [
  { key:"global_backup",  label:"Backup PHI",          icon:"💾", color:"bg-gray-100 text-gray-600", activeColor:"bg-sky-500 text-white",    description:"Upload Global-Backup_PHI.xlsx — tracking backup per ADP per week",    section:"global" },
  { key:"global_restore", label:"Restore PHI",          icon:"🔄", color:"bg-gray-100 text-gray-600", activeColor:"bg-teal-500 text-white",   description:"Upload Global-_Restore_PHI.xlsx — hasil DRP restore per ADP",         section:"global" },
  { key:"global_backlog", label:"Backlog PHI",          icon:"📋", color:"bg-gray-100 text-gray-600", activeColor:"bg-emerald-500 text-white",description:"Upload Global-Backlog_PHI.xlsx — concern & backlog tracker",           section:"global" },
  { key:"global_pilot",   label:"VM Monitoring",        icon:"📊", color:"bg-gray-100 text-gray-600", activeColor:"bg-violet-500 text-white", description:"Upload VM_Storage_Monitoring.xlsx — sheet VM Drive Detail",           section:"global" },
  { key:"global_vm",      label:"Global Area CNS",      icon:"🗺️", color:"bg-gray-100 text-gray-600", activeColor:"bg-cyan-500 text-white",   description:"Upload Area_Cover_CNS_Merged.xlsx — gabungan Area Cover + BOM ROM NOM + List CNS Aktif", section:"global" },
]

const ALL_TABS = [...APPS_TABS, ...MDM_TABS, ...DEV_TABS, ...GLOBAL_TABS]

const readFileForTab = async (tab: TabKey, file: File): Promise<{ jsonData: Record<string, unknown>[]; sheetName: string }> => {
  const buffer   = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { cellDates: true, dateNF: 'yyyy-mm-dd' })

  if (tab === "coda") {
    const sourceSheet = workbook.Sheets["Source 2025 + 2026.W15"]
    const masterSheet  = workbook.Sheets["Master PIC"]
    if (!sourceSheet || !masterSheet) throw new Error("Sheet CODA tidak lengkap (butuh 'Source 2025 + 2026.W15' & 'Master PIC')")
    const sourceData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sourceSheet, { defval: null })
    const masterData  = XLSX.utils.sheet_to_json<Record<string, unknown>>(masterSheet, { defval: null })
    const picMap: Record<string, { dept: unknown; subDept: unknown }> = {}
    masterData.forEach((r) => {
      const pic = String(r["PIC"] ?? "").toLowerCase().trim()
      if (pic) picMap[pic] = { dept: r["Dept."], subDept: r["Sub-Dept"] }
    })
    const jsonData = sourceData.map((r) => {
      const pic = String(r["PIC"] ?? "").toLowerCase().trim()
      const extra = picMap[pic] || {}
      return { ...r, Dept: extra.dept ?? null, "Sub-Dept": extra.subDept ?? null }
    })
    return { jsonData, sheetName: "Merged CODA" }
  }

  const devSheetMap: Record<string, string> = {
    dev_coda:    "Data Source (CODA)",
    dev_sprint:  "Data Source (Dev Sprint)",
    dev_backlog: "Data Source (Project Backlog)",
  }
  if (devSheetMap[tab]) {
    const targetSheet = devSheetMap[tab]
    // Coba cari sheet by name (file BiWeekly lengkap), fallback ke sheet pertama (file sudah dipisah)
    const sheet = workbook.Sheets[targetSheet] ?? workbook.Sheets[workbook.SheetNames[0]]
    const isFromBiweekly = !!workbook.Sheets[targetSheet]
    // BiWeekly punya baris title di row 0, file terpisah langsung header di row 0
    const range = isFromBiweekly ? 1 : 0
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, range })
    const cleaned  = jsonData.filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== ""))
    return { jsonData: cleaned, sheetName: workbook.SheetNames[0] }
  }

  // Global tabs yang butuh sheet spesifik dari Monitoring_Size_DB_VM.xlsx
  const globalSheetMap: Record<string, string> = {
    global_pilot: "VM Drive Detail",
  }
  if (globalSheetMap[tab]) {
    const targetSheet = globalSheetMap[tab]
    // Coba sheet spesifik dulu, kalau tidak ada coba sheet pertama
    const sheet = workbook.Sheets[targetSheet]
    if (!sheet) {
      // Fallback: baca sheet pertama (mungkin user upload file yang sudah dipisah)
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: null })
      const cleaned  = jsonData.filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== ""))
      return { jsonData: cleaned, sheetName: workbook.SheetNames[0] }
    }
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
    const cleaned  = jsonData.filter((r) => Object.values(r).some((v) => v !== null && v !== undefined && v !== ""))
    return { jsonData: cleaned, sheetName: targetSheet }
  }

  const sheetName = workbook.SheetNames[0]
  const jsonData  = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: null })
  return { jsonData, sheetName }
}

export default function DashboardSuperadmin({ userName = "superadmin" }: { userName?: string }) {
  const router = useRouter()
  const [section,      setSection]      = useState<Section>("apps")
  const [activeTab,    setActiveTab]    = useState<TabKey>("dt_transfer")
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null)
  const [isSending,    setIsSending]    = useState(false)
  const [toast,        setToast]        = useState<{ type: "success"|"error"|"warning"|"info"; title: string; message: string } | null>(null)
  const [showLogout,   setShowLogout]   = useState(false)
  const [tabErrors,    setTabErrors]    = useState<Record<string, string>>({})
  const [progress,     setProgress]     = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ROWS_PER_PAGE = 10

  const [uploadStates, setUploadStates] = useState<Record<TabKey, UploadState>>(
    () => Object.fromEntries(ALL_TABS.map((t) => [t.key, { ...initialUploadState }])) as Record<TabKey, UploadState>
  )
  const [currentPage, setCurrentPage] = useState<Record<TabKey, number>>(
    () => Object.fromEntries(ALL_TABS.map((t) => [t.key, 1])) as Record<TabKey, number>
  )

  const TABS        = section === "apps" ? APPS_TABS : section === "mdm" ? MDM_TABS : section === "dev" ? DEV_TABS : GLOBAL_TABS
  const sectionTabs = TABS

  // Listen section change event dari sidebar layout
  useEffect(() => {
    const handler = (e: Event) => {
      const s = (e as CustomEvent<Section>).detail
      setSection(s)
      if (s === "apps") setActiveTab("dt_transfer"); else if (s === "mdm") setActiveTab("mdm_setting"); else if (s === "dev") setActiveTab("dev_coda"); else setActiveTab("global_backup")
    }
    window.addEventListener("superadmin-section", handler)
    return () => window.removeEventListener("superadmin-section", handler)
  }, [])

  useEffect(() => { fetchLastUpdate(); fetchData() }, [activeTab])

  useEffect(() => {
    const channel = supabase
      .channel("realtime-superadmin")
      .on("postgres_changes", { event: "*", schema: "public", table: getTableName(activeTab) }, () => { fetchData(); fetchLastUpdate() })
      .subscribe()
    fetchData()
    return () => { supabase.removeChannel(channel) }
  }, [activeTab])

  const fetchLastUpdate = async () => {
    const { data } = await supabase.from("system_logs").select("*").order("last_update", { ascending: false }).limit(1)
    if (data && data.length > 0) setLastUpdate(new Date(data[0].last_update))
  }

  const fetchData = async () => {
    const table = getTableName(activeTab)
    const { data, count } = await supabase.from(table).select("*", { count: "exact" }).range(0, 999)
    if (data) {
      setUploadStates((prev) => {
        // Jangan timpa file yang sudah diupload user
        if (prev[activeTab]?.isFromUpload) return prev
        return {
          ...prev,
          [activeTab]: { ...prev[activeTab], data, headers: Object.keys(data[0] || {}), rowCount: count || 0, status: "idle", isFromUpload: false },
        }
      })
    }
  }

  const showToast = (type: "success"|"error"|"warning"|"info", title: string, message: string) => {
    setToast({ type, title, message })
    if (type === "success" || type === "info") {
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploadStates((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], status: "loading", errorMsg: "" } }))
    try {
      const { jsonData, sheetName } = await readFileForTab(activeTab, file)
      if (!jsonData || jsonData.length === 0) throw new Error("File kosong atau tidak ada data")

      const headers         = Object.keys(jsonData[0])
      const expectedHeaders = TEMPLATE_HEADERS[activeTab]
      if (!expectedHeaders) throw new Error("Template tab tidak ditemukan")

      const missing = expectedHeaders.map(normalize).filter((h) => !headers.map(normalize).includes(h))
      if (missing.length > 0) throw new Error(`Kolom tidak sesuai: ${missing.slice(0,5).join(", ")}${missing.length > 5 ? ` (+${missing.length-5} lagi)` : ""}`)

      const reordered = jsonData.map((row) => {
        const newRow: Record<string, unknown> = {}
        expectedHeaders.forEach((h) => {
          const key = Object.keys(row).find((k) => normalize(k) === normalize(h))
          newRow[h] = key ? row[key] : null
        })
        return newRow
      })

      setUploadStates((prev) => ({
        ...prev,
        [activeTab]: { fileName: file.name, data: reordered, headers: expectedHeaders, sheetName, rowCount: reordered.length, status: "success", isFromUpload: true, errorMsg: "" },
      }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setUploadStates((prev) => ({ ...prev, [activeTab]: { ...initialUploadState, status: "error", fileName: file.name, errorMsg: msg } }))
    }
  }

  const handleReset = async () => {
    setUploadStates((prev) => ({ ...prev, [activeTab]: { ...initialUploadState } }))
    await fetchData()
  }

  const sendToDatabase = async () => {
    const hasUpload = sectionTabs.some((t) => uploadStates[t.key].isFromUpload)
    if (!hasUpload) { showToast("warning", "Tidak Ada File", "Belum ada file yang diupload untuk dikirim ke database."); return }
    try {
      setIsSending(true); setProgress(0); setTabErrors({})
      let totalRows = 0, processed = 0
      sectionTabs.forEach((t) => { if (uploadStates[t.key].status === "success") totalRows += uploadStates[t.key].data.length })

      const failedTabs: string[] = []
      const successTabs: string[] = []

      for (const tabCfg of sectionTabs) {
        const tab   = tabCfg.key
        const state = uploadStates[tab]
        if (state.status !== "success") continue

        try {
          const table = getTableName(tab)
          const { data: existing } = await supabase.from(table).select("*")
          const mapped       = mapDataByTab(tab, state.data)
          const existingKeys = new Set((existing || []).map((r) => getKey(tab, r as Record<string, unknown>)))
          const newData      = mapped.filter((r) => !existingKeys.has(getKey(tab, r)))

          if (newData.length === 0) {
            console.log(`⚠️ ${tab}: tidak ada data baru`)
            processed += state.data.length
            setProgress(Math.round((processed / totalRows) * 100))
            successTabs.push(tabCfg.label)
            continue
          }

          let tabProcessed = 0
          for (let i = 0; i < newData.length; i += 500) {
            const chunk = newData.slice(i, i + 500)
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 60000)
            try {
              const res = await fetch(
                "https://jytxkqhuwtnmbycxkzdv.functions.supabase.co/upload-data",
                {
                  method: "POST", mode: "cors",
                  signal: controller.signal,
                  headers: {
                    "Content-Type": "application/json",
                    "apikey":        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dHhrcWh1d3RubWJ5Y3hremR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDY1MTEsImV4cCI6MjA5MDI4MjUxMX0.sPYop1Sp4RA63kpxEfSYEz5wl8tIpzby1bCCPwntRV8",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dHhrcWh1d3RubWJ5Y3hremR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDY1MTEsImV4cCI6MjA5MDI4MjUxMX0.sPYop1Sp4RA63kpxEfSYEz5wl8tIpzby1bCCPwntRV8",
                  },
                  body: JSON.stringify({ table, data: chunk }),
                }
              )
              clearTimeout(timeout)
              if (!res.ok) {
                const result = await res.json().catch(() => ({}))
                throw new Error(result.error || `HTTP ${res.status}`)
              }
              tabProcessed += chunk.length
              processed += chunk.length
              setProgress(Math.round((processed / totalRows) * 100))
            } catch (chunkErr: unknown) {
              clearTimeout(timeout)
              const msg = chunkErr instanceof Error ? chunkErr.message : "Unknown error"
              throw new Error(`[${tabCfg.label}] ${msg}`)
            }
          }
          successTabs.push(tabCfg.label)
        } catch (tabErr: unknown) {
          const msg = tabErr instanceof Error ? tabErr.message : "Unknown error"
          failedTabs.push(tabCfg.label)
          setTabErrors((prev) => ({ ...prev, [tab]: msg }))
          console.error(`Tab ${tabCfg.label} failed:`, msg)
          // Lanjutkan ke tab berikutnya meskipun ada yang gagal
          processed += uploadStates[tab].data.length
          setProgress(Math.round((processed / totalRows) * 100))
        }
      }

      // Reset hanya tab yang berhasil
      setUploadStates((prev) => {
        const next = { ...prev }
        sectionTabs.forEach((t) => {
          if (!failedTabs.includes(t.label)) next[t.key] = { ...initialUploadState }
        })
        return next
      })

      if (failedTabs.length === 0) {
        showToast("success", "Berhasil!", `Semua data ${section === "apps" ? "APPS" : section === "mdm" ? "MDM" : section === "dev" ? "Developer" : "Global PHI"} berhasil dikirim ke database.`)
      } else if (successTabs.length > 0) {
        showToast("warning", "Sebagian Berhasil", `✅ Berhasil: ${successTabs.join(", ")}\n❌ Gagal: ${failedTabs.join(", ")}`)
      } else {
        showToast("error", "Gagal!", `Semua modul gagal dikirim: ${failedTabs.join(", ")}`)
      }

      await fetchData()
    } catch (err: unknown) {
      showToast("error", "Error", err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSending(false)
      setLastUpdate(new Date())
      await supabase.from("system_logs").insert({ last_update: new Date().toISOString() })
    }
  }

    const activeTabConfig = ALL_TABS.find((t) => t.key === activeTab)!
  const currentState    = uploadStates[activeTab]
  const currentPage_    = currentPage[activeTab]
  const uploadedCount   = sectionTabs.filter((t) => uploadStates[t.key].isFromUpload).length
  const isAllUploaded   = uploadedCount === sectionTabs.length
  const totalRows_all   = Object.values(uploadStates).reduce((a, s) => a + (s.rowCount || 0), 0)
  const totalPages      = Math.max(1, Math.ceil(currentState.data.length / ROWS_PER_PAGE))
  const paginatedData   = currentState.data.slice((currentPage_ - 1) * ROWS_PER_PAGE, currentPage_ * ROWS_PER_PAGE)
  const formatTime = (d: Date | null) => d ? d.toLocaleString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "-"

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Super Admin — Upload Data</h2>
        <p className="text-sm opacity-80 mt-1">Kelola dan upload semua data KPI ke database</p>
      </div>

      {/* MDM CONTEXT BANNER */}
      {section === "mdm" && (
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Upload Monitoring Setting MDM</h2>
              <p className="text-sm opacity-80 mt-1">Upload file <strong>MDM_2026.xlsx</strong> — sheet <em>Monitoring Setting 2026</em></p>
            </div>
            <div className="text-5xl opacity-20">📐</div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            {MDM_TABS.map((t) => {
              const done = uploadStates[t.key].isFromUpload
              return (
                <div key={t.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${done ? "bg-white text-blue-700" : "bg-white/20 text-white"}`}>
                  {t.icon} {done ? "✅" : "⏳"} {t.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

            {/* DEV CONTEXT BANNER */}
      {section === "dev" && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Upload KPI Developer</h2>
              <p className="text-sm opacity-80 mt-1">Upload ketiga Data Source dari file <strong>BiWeekly Report</strong> untuk mengaktifkan Send to DB</p>
            </div>
            <div className="text-5xl opacity-20">💻</div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            {DEV_TABS.map((t) => {
              const done = uploadStates[t.key].isFromUpload
              return (
                <div key={t.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${done ? "bg-white text-indigo-700" : "bg-white/20 text-white"}`}>
                  {t.icon} {done ? "✅" : "⏳"} {t.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* GLOBAL CONTEXT BANNER */}
      {section === "global" && (
        <div className="bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Upload Global PHI</h2>
              <p className="text-sm opacity-80 mt-1">Upload file Global PHI — Backup, Restore, Backlog, VM Monitoring, Global Area CNS</p>
            </div>
            <div className="text-5xl opacity-20">🌏</div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            {GLOBAL_TABS.map((t) => {
              const done = uploadStates[t.key].isFromUpload
              return (
                <div key={t.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${done ? "bg-white text-sky-700" : "bg-white/20 text-white"}`}>
                  {t.icon} {done ? "✅" : "⏳"} {t.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TABS + SEND BUTTON */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const isDone   = uploadStates[tab.key].isFromUpload
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm relative transition-all ${isActive ? tab.activeColor : tab.color} hover:opacity-90`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
                {isDone && <span className="w-2 h-2 bg-green-400 rounded-full absolute -top-0.5 -right-0.5" />}
              {tabErrors[tab.key] && <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute -top-1 -right-1 border-2 border-white" title="Upload gagal" />}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${section === "apps" ? "bg-green-400" : section === "dev" ? "bg-indigo-400" : "bg-sky-400"}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${section === "apps" ? "bg-green-500" : section === "dev" ? "bg-indigo-500" : "bg-sky-500"}`} />
            </span>
            <span className={`font-medium ${section === "apps" ? "text-green-600" : section === "dev" ? "text-indigo-600" : "text-sky-600"}`}>LIVE</span>
            <span className="text-gray-400">•</span>
            <span>{formatTime(lastUpdate)}</span>
          </div>
          <button disabled={!isAllUploaded} onClick={sendToDatabase}
            className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${isAllUploaded ? (section === "apps" ? "bg-green-500 text-white hover:bg-green-600" : section === "mdm" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-indigo-500 text-white hover:bg-indigo-600") : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            {isAllUploaded ? "🚀 Send to DB" : `⏳ Upload ${uploadedCount}/${sectionTabs.length}`}
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Modul", value: sectionTabs.length.toString(), sub: "Data sources", icon: "📦", bg: "bg-blue-100" },
          { label: "Uploaded",    value: uploadedCount.toString(),      sub: "Siap dikirim", icon: "✅", bg: "bg-green-100" },
          { label: "Total Rows",  value: totalRows_all.toLocaleString(), sub: "Semua modul",  icon: "📊", bg: "bg-purple-100" },
          { label: "Aktif Sekarang", value: activeTabConfig.label, sub: "Tab dipilih", icon: activeTabConfig.icon, bg: "bg-teal-100" },
        ].map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-2xl border flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">{c.label}</p>
              <h2 className="text-2xl font-bold truncate">{c.value}</h2>
              <p className="text-xs text-gray-400">{c.sub}</p>
            </div>
            <div className={`p-3 rounded-full text-xl ${c.bg}`}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* TAB ERROR BANNER */}
      {tabErrors[activeTab] && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-red-500 text-xl flex-shrink-0">❌</span>
          <div>
            <p className="font-semibold text-red-700 text-sm">Modul {activeTabConfig.label} gagal dikirim</p>
            <p className="text-xs text-red-500 mt-0.5">{tabErrors[activeTab]}</p>
            <button onClick={() => setTabErrors((p) => { const n={...p}; delete n[activeTab]; return n })}
              className="text-xs text-red-400 underline mt-1 hover:text-red-600">Tutup</button>
          </div>
        </div>
      )}

      {/* UPLOAD SECTION */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>{activeTabConfig.icon}</span> Upload Data – {activeTabConfig.label}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{activeTabConfig.description}</p>
          </div>
          {currentState.isFromUpload && (
            <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-500 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50">
              🗑️ Hapus Data
            </button>
          )}
        </div>
        <div onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            currentState.status === "success" ? "border-green-300 bg-green-50"
            : currentState.status === "error"  ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50"
          }`}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = "" }}
            className="hidden" />
          {currentState.status === "loading" && (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${section === "apps" ? "border-green-500" : "border-indigo-500"}`} />
              <p className="text-sm text-gray-500">Membaca file...</p>
            </div>
          )}
          {currentState.status === "idle" && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl">📂</div>
              <p className="font-medium text-gray-600">Klik untuk upload atau drag & drop</p>
              {section === "dev" && <p className="text-xs text-indigo-500 font-medium">Sheet: "{activeTabConfig.label}"</p>}
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
              <h2 className="font-semibold text-gray-800">Preview Data – {activeTabConfig.label}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Menampilkan {(currentPage_ - 1) * ROWS_PER_PAGE + 1}–{Math.min(currentPage_ * ROWS_PER_PAGE, currentState.rowCount)} dari {currentState.rowCount.toLocaleString()} baris
              </p>
            </div>
            <button onClick={() => {
              const ws = XLSX.utils.json_to_sheet(currentState.data)
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, currentState.sheetName || "Sheet1")
              XLSX.writeFile(wb, `export_${activeTab}_${Date.now()}.xlsx`)
            }} className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm ${section === "apps" ? "bg-green-500 hover:bg-green-600" : section === "dev" ? "bg-indigo-500 hover:bg-indigo-600" : "bg-sky-500 hover:bg-sky-600"}`}>
              📥 Export Excel
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-white ${section === "apps" ? "bg-gradient-to-r from-green-500 to-teal-500" : section === "dev" ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gradient-to-r from-sky-500 to-teal-500"}`}>
                  <th className="px-3 py-3 text-left font-medium text-xs opacity-80 w-10">#</th>
                  {currentState.headers.map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-medium text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${section === "apps" ? "hover:bg-green-50" : section === "dev" ? "hover:bg-indigo-50" : "hover:bg-sky-50"}`}>
                    <td className="px-3 py-2 text-gray-400 text-xs">{(currentPage_ - 1) * ROWS_PER_PAGE + i + 1}</td>
                    {currentState.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate text-xs">{String(row[h] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">Halaman {currentPage_} dari {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={currentPage_ === 1} onClick={() => setCurrentPage((p) => ({ ...p, [activeTab]: currentPage_ - 1 }))}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">← Sebelumnya</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let p = idx + 1
                  if (totalPages > 5 && currentPage_ > 3) p = currentPage_ - 2 + idx
                  if (p > totalPages) return null
                  return (
                    <button key={p} onClick={() => setCurrentPage((prev) => ({ ...prev, [activeTab]: p }))}
                      className={`px-3 py-1.5 rounded-lg border text-sm ${p === currentPage_ ? (section === "apps" ? "bg-green-500 text-white border-green-500" : section === "dev" ? "bg-indigo-500 text-white border-indigo-500" : "bg-sky-500 text-white border-sky-500") : "hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  )
                })}
                <button disabled={currentPage_ === totalPages} onClick={() => setCurrentPage((p) => ({ ...p, [activeTab]: currentPage_ + 1 }))}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50">Berikutnya →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {currentState.status === "idle" && (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <div className="text-5xl mb-3 opacity-20">{section === "apps" ? "📋" : "💻"}</div>
          <p className="text-gray-400 font-medium">Belum ada data untuk ditampilkan</p>
          <p className="text-xs text-gray-300 mt-1">Upload file Excel di atas untuk melihat preview data</p>
        </div>
      )}

      {/* SENDING OVERLAY */}
      {isSending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-[360px] shadow-2xl text-center">
            <div className="text-5xl mb-3 animate-bounce">🚀</div>
            <h2 className="font-bold text-gray-800 text-lg mb-1">
              Mengirim Data {section === "apps" ? "APPS" : section === "mdm" ? "MDM" : section === "dev" ? "Developer" : "Global PHI"}
            </h2>
            <p className="text-sm text-gray-400 mb-4">Harap tunggu, jangan tutup halaman ini</p>
            <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${section === "apps" ? "bg-gradient-to-r from-green-400 to-teal-500" : section === "dev" ? "bg-gradient-to-r from-indigo-400 to-purple-500" : "bg-gradient-to-r from-sky-400 to-teal-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-gray-600">{progress}% selesai</p>
            {/* Per-tab progress indicators */}
            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              {sectionTabs.map((t) => {
                const state = uploadStates[t.key]
                const hasError = tabErrors[t.key]
                return (
                  <div key={t.key} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                    hasError ? "bg-red-100 text-red-600" :
                    state.isFromUpload ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                  }`}>
                    {hasError ? "❌" : state.isFromUpload ? "✅" : "⏳"} {t.label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2" style={{animation: "slideUp 0.3s ease"}}>
          <div className={`rounded-2xl shadow-2xl p-5 min-w-[320px] max-w-[420px] border-l-4 ${
            toast.type === "success" ? "bg-white border-green-500" :
            toast.type === "error"   ? "bg-white border-red-500"   :
            toast.type === "warning" ? "bg-white border-yellow-500" :
                                       "bg-white border-blue-500"
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">
                {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : toast.type === "warning" ? "⚠️" : "ℹ️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${
                  toast.type === "success" ? "text-green-700" :
                  toast.type === "error"   ? "text-red-700"   :
                  toast.type === "warning" ? "text-yellow-700" : "text-blue-700"
                }`}>{toast.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-gray-300 hover:text-gray-500 flex-shrink-0 text-lg leading-none">×</button>
            </div>
            {/* Progress bar for auto-dismiss */}
            {(toast.type === "success" || toast.type === "info") && (
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                <div className={`h-1 rounded-full ${toast.type === "success" ? "bg-green-400" : "bg-blue-400"}`}
                  style={{ animation: "shrink 4s linear forwards" }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRM MODAL */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-[360px] shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚪</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Keluar dari ODSS?</h2>
            <p className="text-sm text-gray-400 mb-6">Anda akan keluar dari sesi superadmin. Data yang belum dikirim akan hilang.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all">
                Batal
              </button>
              <button onClick={async () => { setShowLogout(false); await supabase.auth.signOut(); window.location.href = "/login" }}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}