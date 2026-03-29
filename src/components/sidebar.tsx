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
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r p-5">

      <h1 className="text-xl font-bold text-green-600 mb-6">
        ODSS
      </h1>

      <div className="space-y-1">
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg transition ${
                  active
                    ? "bg-green-500 text-white shadow-sm hover:shadow-md"
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </div>
            </Link>
          )
        })}
      </div>

    </div>
  )
}