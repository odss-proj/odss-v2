# 🚀 ODSS – One Door System Support

![Status](https://img.shields.io/badge/status-in%20progress-yellow)
![Version](https://img.shields.io/badge/version-0.1-blue)
![License](https://img.shields.io/badge/license-internal-lightgrey)

> One Door System untuk monitoring, automasi, dan transparansi kerja berbasis data.
<img width="969" height="120" alt="image" src="https://github.com/user-attachments/assets/67214341-62b8-420b-ad73-986a21e01aae" />

---

## 📌 Overview

ODSS adalah platform terintegrasi untuk menyatukan seluruh kebutuhan system support dalam satu pintu.
Fokus utama: **otomasi data, monitoring real-time, dan alignment antar tim**.

---

## 👀 Preview UI

### 📊 Dashboard

<img width="2560" height="1978" alt="image" src="https://github.com/user-attachments/assets/bd82de1d-3655-4cb1-8428-35f82d61bb01" />

---

## ⚡ Problem

* Data KPI masih manual (Excel)
* Data tersebar & tidak terpusat
* Monitoring project tidak optimal
* Komunikasi strategical ↔ operational kurang sinkron

---

## 💡 Solution

ODSS menyediakan:

* Dashboard real-time
* Sentralisasi data
* Automasi workflow (n8n)
* Monitoring project & KPI
* Sistem transparansi & alignment

---

## 🧩 Features

* 📊 Dashboard Monitoring
* 📈 KPI Tracking
* 🗂️ Project Monitoring
* 📝 Notulensi & Calendar
* 🎯 Project Priority
* 🏆 Gamifikasi Ranking
* 🔄 Automation Data

---

## 🏗️ Architecture (Simplified)

```text
[User]
   ↓
[ODSS System]
   ↓
[n8n Automation] ──→ [Google Calendar / Spreadsheet]
   ↓
[Database / Cloud]
   ↓
[Dashboard Real-Time]
```

---

## 🔄 Example Automation (n8n)

```javascript
{
  "trigger": "interval (15 minutes)",
  "actions": [
    "fetch data from spreadsheet",
    "process KPI",
    "update database",
    "refresh dashboard"
  ]
}
```

---

## 🧑‍💻 Example API

```javascript
// Node.js (Express)
app.get("/api/kpi", async (req, res) => {
  const data = await getKPI();
  res.json({
    status: "success",
    data
  });
});
```

---

## 🧪 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/odss.git
cd odss
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Setup Environment

Buat file `.env`:

```env
PORT=3000
DB_URL=your_database_url
API_KEY=your_api_key
```

---

### 4. Run Project

```bash
npm run dev
```

---

### 5. Setup n8n (Automation)

* Install n8n:

```bash
npm install n8n -g
```

* Jalankan:

```bash
n8n start
```

* Buat workflow:

  * Trigger: interval (15 menit)
  * Integrasi: Google Sheets / API
  * Output: update database ODSS

---

## 🔐 Role Access

| Role            | Access                   |
| --------------- | ------------------------ |
| Team            | KPI, Dashboard, Calendar |
| Section Head    | + Monitoring Team        |
| Dept Head       | + Strategic Monitoring   |
| Group Dept Head | Full Access              |

---

## 🧠 Development Method

Design Thinking:

1. Empathize
2. Define
3. Ideate
4. Prototype
5. Test

---

## 📅 Timeline

* Feb → Brainstorming
* Mar → Data & Design
* Apr → Development
* May → Preparation

---

## 👥 Team

* Christian Kevin E — Product Owner / Developer
* Mario Widiarta — Product Owner / Developer
* Chornelius Prasetyadharma — Designer / Developer
* Kuncoro Ariadi — Designer / Developer

---

## 🚧 Status

**Currently in development**

---

## 🎯 Goals

* Monitoring berbasis data
* Transparansi tim
* Optimalisasi KPI
* Alignment strategical & operational

---

## 📄 License

Internal Project — Mayora

---
