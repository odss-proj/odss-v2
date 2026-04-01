"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  StickyNote,
} from "lucide-react"

const menu = [
  { name: "Dashboard", href: "/dashboard/mdm", icon: LayoutDashboard },
  { name: "Monitoring KPI", href: "#", icon: BarChart3 },
  { name: "Calendar", href: "#", icon: Calendar },
  { name: "Notes", href: "#", icon: StickyNote },
]

export default function Sidebar() {
  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r p-4 flex flex-col justify-between">

      <div>
        <h1 className="text-green-600 font-bold text-xl mb-6">
          ODSS
        </h1>

        <div className="space-y-2">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
            Dashboard
          </div>
          <div className="px-4 py-2 text-gray-600">Monitoring KPI</div>
          <div className="px-4 py-2 text-gray-600">Calendar</div>
          <div className="px-4 py-2 text-gray-600">Notes</div>
        </div>
      </div>

      <div>
        <div className="bg-gradient-to-r from-blue-500 to-green-400 text-white p-4 rounded-xl">
          Extract KPI
        </div>

        <div className="mt-4 text-gray-400 text-sm">
          Log Out
        </div>
      </div>

    </div>
  )
}