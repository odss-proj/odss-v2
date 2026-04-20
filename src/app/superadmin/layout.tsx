"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Users, BarChart2, LogOut, Menu } from "lucide-react"
import { supabase } from "../../lib/supabase"

type Section = "apps" | "dev" | "global"

function SuperadminSidebar({
  isOpen,
  activeSection,
  onSectionChange,
}: {
  isOpen: boolean
  activeSection: Section
  onSectionChange: (s: Section) => void
}) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const menuItems: { section: Section; icon: string; label: string }[] = [
    { section: "apps",   icon: "🖥️", label: "APPS" },
    { section: "dev",    icon: "💻", label: "Developer" },
    { section: "global", icon: "🌏", label: "Global" },
  ]

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-white border-r flex flex-col justify-between transition-transform duration-300 z-50
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="overflow-y-auto flex-1">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              SA
            </div>
            <span className="text-xl font-bold text-green-600">ODSS</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Super Admin Panel</p>
        </div>

        <div className="px-3 space-y-1">
          {menuItems.map(({ section, icon, label }) => (
            <div
              key={section}
              onClick={() => onSectionChange(section)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all font-semibold text-sm ${
                activeSection === section
                  ? "bg-green-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}

          <div className="px-1 pt-5 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Manajemen</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
            <Users size={15} /> User Management
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
            <BarChart2 size={15} /> Laporan
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer text-sm">
            <Settings size={15} /> Pengaturan
          </div>
        </div>
      </div>

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
  activeSection,
}: {
  toggleSidebar: () => void
  userName: string
  activeSection: Section
}) {
  const titles: Record<Section, string> = {
    apps:   "🖥️ Upload KPI APPS",
    dev:    "💻 Upload KPI Developer",
    global: "🌏 Upload Global PHI",
  }

  return (
    <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Menu className="cursor-pointer text-gray-600" onClick={toggleSidebar} />
        <div>
          <p className="text-gray-500 text-sm">Selamat datang, {userName} 👋</p>
          <h1 className="text-lg font-semibold">{titles[activeSection]}</h1>
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
  const [activeSection, setActiveSection] = useState<Section>("apps")

  const handleSectionChange = (s: Section) => {
    setActiveSection(s)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("superadmin-section", { detail: s }))
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <SuperadminSidebar
        isOpen={isSidebarOpen}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        <SuperadminHeader
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          userName="superadmin"
          activeSection={activeSection}
        />
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}