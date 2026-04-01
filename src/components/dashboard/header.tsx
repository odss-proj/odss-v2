"use client"

import { Bell } from "lucide-react"

export default function Header() {
  return (
    <div className="flex justify-between items-center mb-4">

      <div className="flex items-center gap-3">
        <div className="text-gray-500 text-xl">☰</div>

        <div>
          <p className="text-sm text-gray-400">
            Good Afternoon, Napoleon!
          </p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-2 rounded-full border">
          <Bell size={18} />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gray-300" />
          <span className="font-medium">Napoleon</span>
        </div>
      </div>

    </div>
  )
}