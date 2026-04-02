"use client"

import { useRouter } from "next/navigation"
import NotesCard from "../../../components/notes/notes-card"
import { useNotesStore, Note } from "../../../store/notes-store"

export default function NotesList() {
  const router = useRouter()

  const notes = useNotesStore((s) => s.notes)

  return (
    <div className="bg-white border rounded-xl p-4 space-y-4">

      <div className="flex justify-between">
        <input placeholder="Search..." />

        <button onClick={() => router.push("/dashboard/notes/create")}>
          Add +
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {notes.map((item: Note) => (
          <div
            key={item.id}
            onClick={() => router.push(`/dashboard/notes/${item.id}`)}
          >
            <NotesCard
              id={item.id}
              title={item.title}
              author="You"
            />
          </div>
        ))}
      </div>

    </div>
  )
}