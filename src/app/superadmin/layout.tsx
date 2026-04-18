"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Settings, Users, BarChart2, LogOut, Menu } from "lucide-react"
import { supabase } from "../../lib/supabase"

function SuperadminSidebar({ isOpen }: { isOpen: boolean }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-white border-r flex flex-col justify-between transition-transform duration-300 z-50
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* TOP */}
      <div>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              SA
            </div>
            <span className="text-xl font-bold text-green-600">ODSS</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Super Admin Panel</p>
        </div>

        <div className="px-4 space-y-1">
          <div
            onClick={() => router.push("/superadmin")}
            className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer bg-green-500 text-white"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </div>

          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upload Data</p>
          </div>

          {[
            { icon: "🔄", label: "DT Transfer" },
            { icon: "☁️", label: "Own Cloud" },
            { icon: "📊", label: "Monitoring WF" },
            { icon: "📋", label: "Coda" },
            { icon: "🚚", label: "Logix" },
          ].map((item) => (
            <div
              key={item.label}
              onClick={() => router.push("/superadmin")}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Manajemen</p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
            <Users size={15} />
            User Management
          </div>

          <div className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
            <BarChart2 size={15} />
            Laporan
          </div>

          <div className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
            <Settings size={15} />
            Pengaturan
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="p-4 space-y-3 border-t">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-xl">
          <p className="text-xs opacity-80">Login sebagai</p>
          <p className="font-bold">superadmin</p>
          <p className="text-xs opacity-70 mt-1">Super Administrator</p>
        </div>
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-red-500 hover:bg-red-50 transition-all group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition" />
          <span className="font-medium">Log Out</span>
        </div>
      </div>
    </div>
  )
}

function SuperadminHeader({
  toggleSidebar,
  userName,
}: {
  toggleSidebar: () => void
  userName: string
}) {
  return (
    <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Menu className="cursor-pointer" onClick={toggleSidebar} />
        <div>
          <p className="text-gray-500 text-sm">Selamat datang, {userName} 👋</p>
          <h1 className="text-lg font-semibold">Super Admin Dashboard</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          SA
        </div>
        <div>
          <p className="font-medium text-sm">{userName}</p>
          <p className="text-xs text-gray-400">Super Admin</p>
        </div>
      </div>
    </div>
  )
}

export default function SuperadminRootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // userName dipass via context atau ambil dari children — untuk layout ini pakai default
  return (
    <div className="bg-gray-50 min-h-screen">
      <SuperadminSidebar isOpen={isSidebarOpen} />
      <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        <SuperadminHeader
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          userName="superadmin"
        />
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
