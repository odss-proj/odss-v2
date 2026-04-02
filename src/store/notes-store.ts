"use client"

import { create } from "zustand"

/* ================= TYPES ================= */

export type Note = {
  id: number
  title: string
  date: string
  time: string
  location: string
  agenda: string
  result: string
}

type NotesStore = {
  notes: Note[]
  addNote: (note: Note) => void
}

/* ================= STORE ================= */

export const useNotesStore = create<NotesStore>()((set) => ({
  notes: [],

  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, note],
    })),
}))