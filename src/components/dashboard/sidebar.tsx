"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const menu = [
    { name: "Dashboard", href: "/dashboard/appc" },
    { name: "Monitoring KPI", href: "#" },
    { name: "Calendar", href: "#" },
    { name: "Notes", href: "/dashboard/notes" }, // ✅ INI PENTING
  ]

  return (
    <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 p-4">

      <h1 className="text-green-600 font-bold text-xl mb-6">
        ODSS
      </h1>

      <div className="space-y-2">

        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block px-4 py-2 rounded-lg text-sm ${
              pathname === item.href
                ? "bg-green-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.name}
          </Link>
        ))}

      </div>

    </div>
  )
}