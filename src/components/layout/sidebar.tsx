"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { sidebarMenu, Role } from "../../config/sidebar-menu"
import { getUserRole } from "../../lib/get-user-role"
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Calendar,
  FileText,
  Headphones,
  LogOut,
} from "lucide-react"
import { supabase } from "../../lib/supabase"

type Props = {
  isOpen: boolean
}

export default function Sidebar({ isOpen }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [role, setRole] = useState<Role | null>(null)
  const [menu, setMenu] = useState<any[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useEffect(() => {
    const load = async () => {
      const r = await getUserRole()
      if (!r) return

      const roleTyped = r.toUpperCase() as Role

      setRole(roleTyped)
      setMenu(sidebarMenu[roleTyped] || [])
    }

    load()
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-white border-r flex flex-col justify-between transition-transform duration-300 z-50
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* TOP */}
      <div>
        <div className="p-6 text-xl font-bold text-green-600">
          ODSS
        </div>

        <div className="px-4 space-y-2">

          {/* DASHBOARD */}
          <div
            onClick={() => {
              if (!role) return
              const dashboardPath: Record<string, string> = {
                "SH-APPS":   "/dashboard/apps",
                "SH-APPC":   "/dashboard/appc-sh",
                "SH-MDM":    "/dashboard/mdm-sh",
                "SH-DEVG1":  "/dashboard/dev/g1",
                "SH-DEVG2":  "/dashboard/dev/g2",
                "SH-DEVRND": "/dashboard/dev/rnd",
                "SH-DEVDSO": "/dashboard/dev/dso",
                "SH-GLOBAL": "/dashboard/global",
              }
              const path = dashboardPath[role] || `/dashboard/${role.toLowerCase()}`
              router.push(path)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-green-500 text-white"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </div>

          {/* DYNAMIC MENU */}
          {menu.map((item, i) => (
            <div key={i}>

              <div
                onClick={() =>
                  setOpenIndex(openIndex === i ? null : i)
                }
                className="flex justify-between items-center px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <span>{item.title}</span>
                {openIndex === i ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {openIndex === i && (
                <div className="ml-6 mt-2 space-y-2">
                  {item.children.map((child: any, j: number) => (
                    <div
                      key={j}
                      onClick={() => router.push(child.path)}
                      className={`px-3 py-2 rounded-lg cursor-pointer text-sm ${
                        isActive(child.path)
                          ? "bg-green-100 text-green-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {child.name}
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}

          {/* STATIC */}
          <div
            onClick={() => router.push("/calendar")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <Calendar size={18} />
            Calendar
          </div>

          <div
            onClick={() => router.push("/notes")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <FileText size={18} />
            Notes
          </div>

          <div className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
            <Headphones size={18} />
            Apps Support
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="p-4 space-y-4 border-t">

        <div className="bg-gradient-to-r from-blue-500 to-green-400 text-white p-4 rounded-xl text-center cursor-pointer">
          Extract KPI
        </div>

        {/* 🔥 LOGOUT BAGUS */}
        <div
          onClick={async () => {
            await supabase.auth.signOut()
            router.push("/login")
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer 
          text-red-500 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition" />
          <span className="font-medium">Log Out</span>
        </div>
      </div>
    </div>
  )
}