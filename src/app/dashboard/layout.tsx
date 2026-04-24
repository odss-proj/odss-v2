"use client"

import { useState } from "react"
import Sidebar from "../../components/layout/sidebar"
import Header from "../../components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen">

      {/* SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* CONTENT */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
