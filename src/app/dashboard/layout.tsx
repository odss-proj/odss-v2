"use client"

import Sidebar from "../../components/layout/sidebar"
import { Bell, Search } from "lucide-react"
import Header from "../../components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <Sidebar />

      <div className="flex-1 flex flex-col ml-64">

        {/* 🔥 HEADER GLOBAL */}
        <Header />

        {/* CONTENT */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  )
}