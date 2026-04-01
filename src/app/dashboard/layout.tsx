"use client"

import { useState } from "react"
import Sidebar from "../../components/dashboard/sidebar"
import { Bell, Search, Menu } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50">

      {/* SIDEBAR */}
      {open && (
        <div className="w-64 bg-white border-r">
          <Sidebar />
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="bg-white px-6 py-4 border-b flex justify-between items-center">

          <div className="flex items-center gap-4">

            <button onClick={() => setOpen(!open)}>
              <Menu />
            </button>

            <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg w-64">
              <Search size={16} />
              <input className="ml-2 bg-transparent outline-none w-full" />
            </div>

          </div>

          <div className="flex items-center gap-4">
            <Bell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full" />
              Kevin
            </div>
          </div>

        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

      </div>
    </div>
  )
}