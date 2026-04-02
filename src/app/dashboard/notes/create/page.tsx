"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotesStore } from "../../../../store/notes-store"

type FormType = {
  title: string
  date: string
  time: string
  location: string
  agenda: string
  result: string
}

export default function CreateNotesPage() {
  const router = useRouter()
  const addNote = useNotesStore((state) => state.addNote)

  const [form, setForm] = useState<FormType>({
    title: "",
    date: "",
    time: "",
    location: "",
    agenda: "",
    result: "",
  })

  const handleChange = (key: keyof FormType, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    addNote({
      id: Date.now(),
      ...form,
    })

    router.push("/dashboard/notes")
  }

  return (
    <div className="space-y-6">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
      >
        ← Back
      </button>

      {/* CARD */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-5xl">

        <div className="space-y-6">

          {/* DATE */}
          <div className="flex items-center gap-6">
            <p className="w-40 text-sm text-gray-500">
              Hari/Tanggal
            </p>

            <div className="flex gap-3 w-full">
              <input
                type="date"
                className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => handleChange("date", e.target.value)}
              />

              <input
                type="time"
                className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => handleChange("time", e.target.value)}
              />
            </div>
          </div>

          {/* TITLE */}
          <div className="flex items-center gap-6">
            <p className="w-40 text-sm text-gray-500">
              Nama Meeting
            </p>

            <input
              placeholder="Contoh: Meeting Project Nasional"
              className="bg-gray-50 border border-gray-200 rounded-full px-5 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          {/* SYSTEM */}
          <div className="flex items-center gap-6">
            <p className="w-40 text-sm text-gray-500">
              Aplikasi/System
            </p>

            <div className="relative w-full">
            <select className="appearance-none bg-gray-50 border border-gray-200 rounded-full px-5 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500">
                <option>Pilih Aplikasi</option>
                <option>Ficom</option>
                <option>SFA</option>
                <option>MIX</option>
            </select>

            <span className="absolute right-4 top-2.5 text-gray-400">
                ▼
            </span>
            </div>
          </div>

          {/* PARTICIPANT */}
          <div className="flex items-center gap-6">
            <p className="w-40 text-sm text-gray-500">
              Partisipan
            </p>

            <button className="border-2 border-dashed border-green-400 text-green-600 px-4 py-2 rounded-full text-sm hover:bg-green-50 transition">
              + Tambah Partisipan
            </button>
          </div>

          {/* LOCATION */}
          <div className="flex items-center gap-6">
            <p className="w-40 text-sm text-gray-500">
              Lokasi
            </p>

            <input
              placeholder="Contoh: Ruang Meeting 2.6"
              className="bg-gray-50 border border-gray-200 rounded-full px-5 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          {/* AGENDA */}
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Agenda Meeting :
            </p>

            <textarea
              placeholder="Membahas Project Ficom Lite bersama dengan BOD..."
              className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 w-full h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) => handleChange("agenda", e.target.value)}
            />
          </div>

          {/* RESULT */}
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Poin Hasil Meeting
            </p>

            <textarea
              placeholder="• Improvement Halaman Dashboard"
              className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 w-full h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) => handleChange("result", e.target.value)}
            />
          </div>

          {/* SAVE */}
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-full font-medium text-sm shadow-md hover:opacity-90 transition"
          >
            💾 Save Notes
          </button>

        </div>

      </div>
    </div>
  )
}