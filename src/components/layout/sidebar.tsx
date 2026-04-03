"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import LogoutButton from "./logout-button"

type Role = "mdm" | "appc" | "appt"

type Props = {
  role?: Role
}

export default function Sidebar({ role = "mdm" }: Props) {
  const pathname = usePathname()

  const [openKPI, setOpenKPI] = useState(
    pathname.includes("/dashboard")
  )

  /* ================= MENU CONFIG ================= */

  const kpiMenu: Record<Role, { name: string; href: string }[]> = {
    mdm: [
      { name: "Excel", href: "/dashboard/mdm/excel" },
      { name: "Coda", href: "/dashboard/mdm/coda" },
    ],

    appc: [
      { name: "Coda", href: "/dashboard/appc/coda" },
      { name: "Logix", href: "/dashboard/appc/logix" },
      { name: "Docusaurus", href: "/dashboard/appc/docusaurus" },
      { name: "WSS", href: "/dashboard/appc/wss" },
      { name: "Spreadsheet", href: "/dashboard/appc/spreadsheet" },
    ],

    appt: [
      { name: "Coda", href: "/dashboard/appt/coda" },
      { name: "Logix", href: "/dashboard/appt/logix" },
      { name: "Docusaurus", href: "/dashboard/appt/docusaurus" },
      { name: "WSS", href: "/dashboard/appt/wss" },
      { name: "Spreadsheet", href: "/dashboard/appt/spreadsheet" },
    ],
  }

  const menu = kpiMenu[role]

  /* ================= UI ================= */

  return (
    <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 p-4 flex flex-col justify-between">

      {/* TOP */}
      <div>

        {/* LOGO */}
        <h1 className="text-green-600 font-bold text-xl mb-6">
          ODSS
        </h1>

        {/* MENU */}
        <div className="space-y-2">

          {/* DASHBOARD */}
          <Link
            href={`/dashboard/${role}`}
            className={`block px-4 py-2 rounded-xl text-sm ${
              pathname === `/dashboard/${role}`
                ? "bg-green-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Dashboard
          </Link>

          {/* MONITORING KPI */}
          <div>

            <button
              onClick={() => setOpenKPI(!openKPI)}
              className="w-full flex justify-between items-center px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100"
            >
              <span>Monitoring KPI</span>

              {openKPI ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {/* NESTED */}
            {openKPI && (
              <div className="mt-2 space-y-1 ml-6 border-l border-gray-200 pl-3">

                {menu.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm transition ${
                      pathname === item.href
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

              </div>
            )}
          </div>

          {/* MENU LAIN */}
          <Link
            href="/dashboard/calendar"
            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Calendar
          </Link>

          <Link
            href="/dashboard/notes"
            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Notes
          </Link>

        </div>

      </div>

      {/* FOOTER */}
      <div className="space-y-2">

        <button className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-3 rounded-xl">
          Extract KPI
        </button>

        <LogoutButton />

      </div>

    </div>
  )
}