# ODSS (One Door System Support) - Mayora
> [cite_start]Satu Pintu Untuk Kebutuhan System Support [cite: 3]

![Status](https://img.shields.io/badge/Status-In--Progress-orange)
![Framework](https://img.shields.io/badge/Framework-Design--Thinking-blue)
![Company](https://img.shields.io/badge/Company-MAYORA-red)

[cite_start]**ODSS** adalah platform kendali terpusat yang dirancang untuk menyatukan seluruh alur kerja divisi System Support di **PT Mayora Indah Tbk**[cite: 1, 2, 4]. [cite_start]Proyek ini fokus pada otomatisasi data dan visibilitas real-time untuk memastikan setiap keputusan operasional didasarkan pada data yang akurat[cite: 22].

---

## 📌 Masalah & Tantangan (Pain Points)
[cite_start]Berdasarkan analisis internal, terdapat beberapa kendala utama yang menghambat produktivitas tim[cite: 5]:

* [cite_start]**Crunching Data KPI Manual:** Pengolahan data performa personal masih menggunakan Excel secara manual[cite: 14, 15].
* [cite_start]**Data Tersebar:** Pengelolaan manual menciptakan celah kesalahan (human error) yang besar[cite: 7].
* [cite_start]**Misalignment Komunikasi:** Strategi dari level *Strategical* sering kali tidak tersampaikan dengan baik ke level *Operational*[cite: 17, 18].
* [cite_start]**Monitoring Project Pilot:** Banyak proyek yang sudah dibuat namun tidak terlaksana secara maksimal karena kurangnya pengawasan terpadu[cite: 19, 20].

---

## 🚀 Solusi & Fitur Utama
[cite_start]ODSS menghadirkan solusi "Satu Pintu" dengan fitur-fitur berikut[cite: 21, 23]:

* [cite_start]**Dashboard Monitoring Real-Time:** Memberikan visibilitas instan terhadap progres kerja[cite: 24].
* [cite_start]**Gamifikasi Rangking:** Mendorong persaingan sehat melalui transparansi pencapaian KPI[cite: 25, 287].
* [cite_start]**Sentralisasi Data:** Mengintegrasikan seluruh data dalam satu database terpadu[cite: 26].
* [cite_start]**Manajemen Proyek:** Dilengkapi dengan *Calendar Project*, *Notulensi Proyek*, dan *Monitoring Project Priority*[cite: 29, 30, 37].

---

## 🛠️ Arsitektur Teknis
[cite_start]Sistem ini dibangun dengan mengedepankan otomatisasi alur kerja[cite: 72, 76].

### Tech Stack:
* [cite_start]**Coda:** Sebagai basis database dan antarmuka dashboard pengguna[cite: 73].
* [cite_start]**n8n:** Engine otomasi yang memperbarui data secara otomatis setiap 15 menit[cite: 74, 83].
* [cite_start]**Google Calendar:** Sinkronisasi jadwal dan *timeline* proyek secara langsung[cite: 88, 89].

### Alur Otomatisasi (Workflow):
1.  [cite_start]**Start:** Triger otomatisasi dimulai[cite: 80].
2.  [cite_start]**Setting & Otomasi n8n:** Menarik data dari berbagai sumber[cite: 81, 82].
3.  [cite_start]**Sync ODSS:** Update data ke dashboard setiap 15 menit[cite: 83, 84].
4.  [cite_start]**Finish:** User menerima informasi terbaru secara real-time[cite: 85, 86].

---

## 💻 Cuplikan Implementasi

### 1. Data Transformation (n8n Logic)
Contoh logika JavaScript di n8n untuk membersihkan data sebelum masuk ke ODSS:
```javascript
const rawData = items[0].json;
return rawData.map(item => ({
    employee_id: item.id,
    kpi_score: parseFloat(item.score).toFixed(2),
    status: item.score >= item.target ? "Achieved" : "Under Target"
}));



# 2. SQL Query (KPI Monitoring)
