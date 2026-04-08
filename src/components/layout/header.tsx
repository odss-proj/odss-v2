"use client"

import { Menu } from "lucide-react"
import { usePathname } from "next/navigation"

export default function Header({
  toggleSidebar,
}: {
  toggleSidebar: () => void
}) {
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname.includes("coda")) return "Monitoring KPI > Coda"
    if (pathname.includes("logix")) return "Monitoring KPI > Logix"
    if (pathname.includes("dashboard")) return "Dashboard"
    return "Dashboard"
  }

  return (
    <div className="bg-white px-6 py-4 border-b flex justify-between items-center">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <Menu
          className="cursor-pointer"
          onClick={toggleSidebar}
        />

        <div>
          <p className="text-gray-500 text-sm">
            Good Afternoon, Napoleon 👋
          </p>
          <h1 className="text-lg font-semibold">
            {getTitle()}
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-full" />
        <span className="font-medium">Napoleon</span>
      </div>
    </div>
  )
}