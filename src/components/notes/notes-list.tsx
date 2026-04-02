"use client"

import { useRouter } from "next/navigation"
import NotesCard from "../notes/notes-card"

const dummyData = [
  { id: 1, title: "Pembahasan Rollout", author: "Pak Agung" },
  { id: 2, title: "Meeting KPI", author: "Kevin" },
  { id: 3, title: "Evaluasi Sistem", author: "Napoleon" },
]

export default function NotesList() {
  const router = useRouter()

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">

      {/* TOP BAR */}
      <div className="flex justify-between items-center">

        <input
          placeholder="Cari Catatan"
          className="border px-4 py-2 rounded-lg w-1/2"
        />

        <div className="flex gap-2">
          <button className="border px-4 py-2 rounded-lg">
            Upload
          </button>

          <button
            onClick={() => router.push("/dashboard/notes/create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Add +
          </button>
        </div>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-4">

        {dummyData.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/dashboard/notes/${item.id}`)}
          >
            <NotesCard {...item} />
          </div>
        ))}

      </div>

    </div>
  )
}