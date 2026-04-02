"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NotesForm() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = () => {
    console.log({ title, content })

    // nanti connect ke backend
    router.push("/dashboard/notes")
  }

  return (
    <div className="space-y-4 max-w-xl">

      <input
        placeholder="Title"
        className="border p-2 w-full rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Content"
        className="border p-2 w-full rounded h-40"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Save
      </button>

    </div>
  )
}