"use client"

import NotesList from "../../../components/notes/notes-list"

export default function NotesPage() {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <p className="text-sm text-gray-500">
          Good Afternoon, Napoleon!
        </p>
        <h1 className="text-2xl font-semibold">All Notes</h1>
      </div>

      {/* BANNER */}
      <div className="bg-gradient-to-r from-blue-500 to-green-400 text-white p-6 rounded-xl">
        Semangat Dalam Menuntaskan Semua Task!
      </div>

      {/* CONTENT */}
      <NotesList />

    </div>
  )
}